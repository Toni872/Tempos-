param(
    [string]$ProjectId = "tempos-project",
    [string]$Region = "europe-west4",
    [string]$ServiceName = "tempos-retrain-worker",
    [string]$TopicName = "tempos-vertex-retrain",
    [string]$RuntimeServiceAccount = "tempos-backend-sa@tempos-project.iam.gserviceaccount.com",
    [string]$VertexStagingBucket = "gs://bucket-quickstart_tempos-project"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

Write-Output "[1/6] Configurando proyecto..."
gcloud config set project $ProjectId | Out-Null

Write-Output "[2/6] Habilitando APIs..."
gcloud services enable run.googleapis.com pubsub.googleapis.com cloudbuild.googleapis.com --project $ProjectId | Out-Null

Write-Output "[3/6] Desplegando servicio Cloud Run..."
$backendRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$workerSource = Join-Path $backendRoot "retrain-worker"
gcloud run deploy $ServiceName `
    --project=$ProjectId `
    --region=$Region `
    --source "$workerSource" `
    --allow-unauthenticated `
    --service-account "$RuntimeServiceAccount" `
    --set-env-vars "PROJECT_ID=$ProjectId,VERTEX_REGION=$Region,VERTEX_JOB_NAME=tempos-retrain-job,VERTEX_STAGING_BUCKET=$VertexStagingBucket" | Out-Null

Write-Output "[4/6] Obteniendo URL del servicio..."
$serviceUrl = gcloud run services describe $ServiceName --project $ProjectId --region $Region --format="value(status.url)"

Write-Output "[5/6] Creando suscripcion push a Pub/Sub..."
$subName = "$TopicName-sub"
$existsSub = (gcloud pubsub subscriptions list --project $ProjectId --format="value(name)" --filter="name:$subName")
if (-not $existsSub) {
    gcloud pubsub subscriptions create $subName `
        --project=$ProjectId `
        --topic=$TopicName `
        --push-endpoint="$serviceUrl/" | Out-Null
}

Write-Output "[6/6] Estado final..."
gcloud pubsub subscriptions describe $subName --project $ProjectId --format="yaml(name,topic,pushConfig.pushEndpoint)"
Write-Output "OK: Worker desplegado y suscripcion conectada."
