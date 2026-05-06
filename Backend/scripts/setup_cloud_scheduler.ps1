param(
    [string]$ProjectId = "tempos-project",
    [string]$Region = "europe-west4",
    [string]$JobName = "tempos-vertex-retrain-daily",
    [string]$CloudBuildTriggerId = "",
    [string]$PubSubTopic = "tempos-vertex-retrain",
    [string]$InvokerServiceAccount = "tempos-backend-sa@tempos-project.iam.gserviceaccount.com",
    [string]$Cron = "0 3 * * *",
    [string]$TimeZone = "Europe/Madrid"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

Write-Output "[1/6] Configurando proyecto..."
gcloud config set project $ProjectId | Out-Null

Write-Output "[2/6] Habilitando APIs necesarias..."
gcloud services enable cloudscheduler.googleapis.com cloudbuild.googleapis.com iam.googleapis.com pubsub.googleapis.com --project $ProjectId | Out-Null

Write-Output "[3/6] Eliminando job previo si existe..."
$existingJob = (gcloud scheduler jobs list --location=$Region --project=$ProjectId --format="value(name)" --filter="name~$JobName")
if ($existingJob) {
    gcloud scheduler jobs delete $JobName --location=$Region --project=$ProjectId --quiet | Out-Null
}

if ($CloudBuildTriggerId -ne "") {
    $uri = "https://cloudbuild.googleapis.com/v1/projects/$ProjectId/locations/$Region/triggers/$CloudBuildTriggerId:run"
    Write-Output "[4/6] Creando Cloud Scheduler HTTP job contra Cloud Build trigger..."
    gcloud scheduler jobs create http $JobName `
        --location=$Region `
        --project=$ProjectId `
        --schedule="$Cron" `
        --time-zone="$TimeZone" `
        --uri="$uri" `
        --http-method=POST `
        --oauth-service-account-email="$InvokerServiceAccount" `
        --oauth-token-scope="https://www.googleapis.com/auth/cloud-platform" `
        --message-body="{}" | Out-Null
}
else {
    Write-Output "[4/6] Sin trigger de Cloud Build: creando topic y job Pub/Sub de retraining..."
    $existingTopic = (gcloud pubsub topics list --project=$ProjectId --format="value(name)" --filter="name:$PubSubTopic")
    if (-not $existingTopic) {
        gcloud pubsub topics create $PubSubTopic --project=$ProjectId | Out-Null
    }
    $payload = '{"action":"vertex_retrain","project":"' + $ProjectId + '","region":"' + $Region + '"}'
    gcloud scheduler jobs create pubsub $JobName `
        --location=$Region `
        --project=$ProjectId `
        --schedule="$Cron" `
        --time-zone="$TimeZone" `
        --topic=$PubSubTopic `
        --message-body="$payload" | Out-Null
}

Write-Output "[5/6] Verificando job..."
gcloud scheduler jobs describe $JobName --location=$Region --project=$ProjectId --format="yaml(name,schedule,timeZone,httpTarget.uri,state)"

Write-Output "[6/6] Ejecucion manual de prueba..."
gcloud scheduler jobs run $JobName --location=$Region --project=$ProjectId | Out-Null

Write-Output "OK: Cloud Scheduler configurado y job ejecutado manualmente."
