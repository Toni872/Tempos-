# Install scheduled task to run start.ps1 at user logon
$taskName = "TemposStart"
$scriptPath = "C:\Users\Antonio\Desktop\Tempos\Backend\scripts\start.ps1"

if (-not (Test-Path $scriptPath)) {
  Write-Error "No se encontro el script: $scriptPath"
  exit 1
}

# Requiere elevacion para evitar errores de permisos con schtasks en algunos entornos.
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Output "Solicitando elevacion UAC para crear la tarea programada..."
  $self = $MyInvocation.MyCommand.Path
  if (-not $self) {
    Write-Error "No se pudo resolver la ruta del script para autoelevacion."
    exit 1
  }
  Start-Process PowerShell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$self`""
  exit 0
}

$taskCommand = "PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

schtasks /Create /SC ONLOGON /TN $taskName /TR $taskCommand /RL LIMITED /F | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "No se pudo crear la tarea '$taskName'."
  exit $LASTEXITCODE
}

Write-Output "Scheduled task '$taskName' created."
