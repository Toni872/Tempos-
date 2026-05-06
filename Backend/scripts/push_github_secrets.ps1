param(
    [string]$ProjectId = "tempos-project",
    [string]$Repo = "",
    [string]$GcsBucket = "bucket-quickstart_tempos-project",
    [string]$VertexRegion = "europe-west4",
    [string]$SecretSaKeyName = "tempos-firebase-key-json"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

Write-Output "[1/7] Verificando GitHub CLI..."
$null = gh --version

Write-Output "[2/7] Verificando autenticacion en GitHub CLI..."
gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI no autenticado. Ejecuta: gh auth login"
}

if ($Repo -eq "") {
    Write-Output "[3/7] Detectando repo remoto desde git..."
    $origin = git remote get-url origin 2>$null
    if (-not $origin) {
        throw "No hay remoto git 'origin'. Crea o vincula el repo y vuelve a ejecutar."
    }

    if ($origin -match "github\.com[:/](.+?)(\.git)?$") {
        $Repo = $Matches[1]
    }

    if ($Repo -eq "") {
        throw "No se pudo inferir owner/repo desde origin: $origin"
    }
}

Write-Output "[4/7] Configurando proyecto GCP..."
gcloud config set project $ProjectId | Out-Null

Write-Output "[5/7] Obteniendo JSON de cuenta de servicio desde Secret Manager..."
$saJson = gcloud secrets versions access latest --secret=$SecretSaKeyName --project=$ProjectId
if (-not $saJson) {
    throw "No se pudo leer el secreto $SecretSaKeyName en el proyecto $ProjectId"
}

Write-Output "[6/7] Publicando GitHub Secrets en $Repo..."
# Verifica acceso al endpoint de secrets antes de intentar escribir.
gh api "repos/$Repo/actions/secrets/public-key" | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "No hay permisos para gestionar secrets en $Repo. Revisa el token (repo/workflow/read:org para classic, o Secrets RW + Actions RW para fine-grained)."
}

$saJson | gh secret set GCP_SA_KEY --repo $Repo
if ($LASTEXITCODE -ne 0) {
    throw "Fallo al crear GCP_SA_KEY en $Repo"
}

$ProjectId | gh secret set GCP_PROJECT --repo $Repo
if ($LASTEXITCODE -ne 0) {
    throw "Fallo al crear GCP_PROJECT en $Repo"
}

$GcsBucket | gh secret set GCS_BUCKET --repo $Repo
if ($LASTEXITCODE -ne 0) {
    throw "Fallo al crear GCS_BUCKET en $Repo"
}

$VertexRegion | gh secret set VERTEX_REGION --repo $Repo
if ($LASTEXITCODE -ne 0) {
    throw "Fallo al crear VERTEX_REGION en $Repo"
}

Write-Output "[7/7] Verificacion final de nombres de secrets..."
gh secret list --repo $Repo | Select-String -Pattern "GCP_SA_KEY|GCP_PROJECT|GCS_BUCKET|VERTEX_REGION" | ForEach-Object { $_.Line }
if ($LASTEXITCODE -ne 0) {
    throw "No se pudieron listar los secrets en $Repo tras la carga"
}

Write-Output "OK: GitHub Secrets cargados correctamente en $Repo."
