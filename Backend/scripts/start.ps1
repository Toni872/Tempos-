# Start Tempos backend stack (PowerShell)
$proj = "C:\Users\Antonio\Desktop\Tempos\Backend"
Set-Location $proj
Write-Output "Starting Docker Compose stack..."
docker compose pull
docker compose up -d
Write-Output "Waiting for API to become healthy..."
Start-Sleep -Seconds 5
try {
    $resp = Invoke-RestMethod http://localhost:8080/health -TimeoutSec 10
    Write-Output "Health OK: $($resp | ConvertTo-Json -Compress)"
}
catch {
    Write-Error "Health check failed: $_"
}
