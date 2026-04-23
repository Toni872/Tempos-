# Protocolo de Seguridad Tempos (Efecto Script9)

$ErrorActionPreference = "Stop"
Write-Host "--- INICIANDO PROTOCOLO DE SEGURIDAD TEMPOS ---" -ForegroundColor Cyan
Write-Host "Objetivo: Cero errores en producción (Inspiración Script9)" -ForegroundColor Gray

# 1. Rutas
$Root = Get-Location
$BackendPath = Join-Path $Root "Backend"
$FrontendPath = Join-Path $Root "Frontend"

# 2. Fase de Tipado (TypeScript)
Write-Host "`n[Fase 1/3] Verificando Tipos (Backend)..." -ForegroundColor Yellow
Set-Location $BackendPath
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Fallo de tipos en Backend" -ForegroundColor Red; exit 1 }
Write-Host "Backend Types OK" -ForegroundColor Green

# 3. Fase de Tests y Auditoría Legal
Write-Host "`n[Fase 2/3] Ejecutando Tests de Auditoría y Compliance..." -ForegroundColor Yellow
# Cargamos .env para que los tests tengan DATABASE_URL
if (Test-Path ".env") {
    $dotenv = Get-Content .env
    foreach ($line in $dotenv) {
        if ($line -match "^([^#=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value)
        }
    }
}
npm test
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Tests fallidos. Revisa la trazabilidad legal." -ForegroundColor Red; exit 1 }
Write-Host "Compliance Tests OK" -ForegroundColor Green

# 4. Fase de Build Frontend
Write-Host "`n[Fase 3/3] Simulando Proceso de Compilación Frontend..." -ForegroundColor Yellow
Set-Location $FrontendPath
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Fallo en el Build del Frontend" -ForegroundColor Red; exit 1 }
Write-Host "Frontend Build OK" -ForegroundColor Green

# 5. Resumen Final
Set-Location $Root
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "SISTEMA SEGURO - LISTO PARA DESPLIEGUE" -ForegroundColor Green
Write-Host "Próximo paso: gcloud builds submit" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
