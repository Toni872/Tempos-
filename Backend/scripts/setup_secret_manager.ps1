param(
    [string]$ProjectId = "tempos-project",
    [string]$FirebaseKeyPath = "C:\Users\Antonio\Desktop\Tempos\Backend\firebase-key.json",
    [string]$SecretFirebase = "tempos-firebase-key-json",
    [string]$SecretDbUrl = "tempos-db-url",
    [string]$DbUrl = "",
    [string]$Region = "europe-west4"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

Write-Output "[1/6] Configurando proyecto..."
gcloud config set project $ProjectId | Out-Null

Write-Output "[2/6] Habilitando APIs necesarias..."
gcloud services enable secretmanager.googleapis.com cloudkms.googleapis.com --project $ProjectId | Out-Null

if (!(Test-Path $FirebaseKeyPath)) {
    throw "No se encontro el archivo de clave Firebase en: $FirebaseKeyPath"
}

Write-Output "[3/6] Creando secreto de Firebase (si no existe)..."
$existsFirebase = (gcloud secrets list --project $ProjectId --filter="name:$SecretFirebase" --format="value(name)")
if (-not $existsFirebase) {
    gcloud secrets create $SecretFirebase --replication-policy="automatic" --project $ProjectId | Out-Null
}

Write-Output "[4/6] Subiendo nueva version de secreto Firebase..."
gcloud secrets versions add $SecretFirebase --data-file="$FirebaseKeyPath" --project $ProjectId | Out-Null

if ($DbUrl -ne "") {
    Write-Output "[5/6] Creando/actualizando secreto DB URL..."
    $existsDb = (gcloud secrets list --project $ProjectId --filter="name:$SecretDbUrl" --format="value(name)")
    if (-not $existsDb) {
        gcloud secrets create $SecretDbUrl --replication-policy="automatic" --project $ProjectId | Out-Null
    }

    $tmp = Join-Path $env:TEMP "tempos_db_url.txt"
    Set-Content -Path $tmp -Value $DbUrl -NoNewline -Encoding ASCII
    gcloud secrets versions add $SecretDbUrl --data-file="$tmp" --project $ProjectId | Out-Null
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}
else {
    Write-Output "[5/6] DB URL no proporcionada. Se omite secreto $SecretDbUrl."
}

Write-Output "[6/6] Listado final de secretos relevantes..."
gcloud secrets list --project $ProjectId --filter="name~tempos" --format="table(name,createTime)"

Write-Output "OK: Secret Manager configurado para proyecto $ProjectId en region objetivo $Region."
