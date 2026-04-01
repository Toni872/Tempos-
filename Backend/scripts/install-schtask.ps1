# Install scheduled task to run start.ps1 at user logon
$taskName = "TemposStart"
$scriptPath = "C:\Users\Antonio\Desktop\Tempos\Backend\scripts\start.ps1"

if (-not (Test-Path $scriptPath)) {
  Write-Error "No se encontro el script: $scriptPath"
  exit 1
}

$taskCommand = "PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

# Intenta crear para el usuario actual sin elevacion (modo interactivo).
schtasks /Create /SC ONLOGON /TN $taskName /TR $taskCommand /RL LIMITED /F | Out-Null
if ($LASTEXITCODE -eq 0) {
  Write-Output "Scheduled task '$taskName' created for current user."
  exit 0
}

# Si falla, intenta autoelevacion como fallback.
Write-Output "Creacion sin elevacion fallo. Intentando con UAC..."
$self = $MyInvocation.MyCommand.Path
if (-not $self) {
  Write-Error "No se pudo resolver la ruta del script para autoelevacion."
  exit 1
}
Start-Process PowerShell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$self`""
exit 0
