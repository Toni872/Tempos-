param(
    [string]$RepoName = "Tempos",
    [string]$Visibility = "private"
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

Write-Output "[1/5] Verificando autenticacion en GitHub CLI..."
gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "GitHub CLI no autenticado. Ejecuta: gh auth login"
}

$root = "C:\Users\Antonio\Desktop\Tempos"
Set-Location $root

Write-Output "[2/5] Verificando repositorio git local..."
$inside = git rev-parse --is-inside-work-tree 2>$null
if (-not $inside) {
    throw "No se detecta repo git en $root"
}

Write-Output "[3/5] Creando repo remoto en GitHub..."
# Crea remoto 'origin' y hace push inicial en main
if ($Visibility -eq "public") {
    gh repo create $RepoName --source . --public --remote origin --push
}
else {
    gh repo create $RepoName --source . --private --remote origin --push
}

Write-Output "[4/5] Confirmando remoto origin..."
git remote -v

Write-Output "[5/5] Repositorio preparado."
