# Start Tempos backend + frontend stack (PowerShell)
$proj = "C:\Users\Antonio\Desktop\Tempos\Backend"
Set-Location $proj
Write-Output "Starting Docker Compose stack..."
docker compose pull
docker compose up -d

# Start frontend dev server if not already listening on 5173.
$frontendDir = "C:\Users\Antonio\Desktop\Tempos\Frontend"
if (Test-Path $frontendDir) {
    try {
        $frontendUp = Test-NetConnection -ComputerName "localhost" -Port 5173 -WarningAction SilentlyContinue
        if (-not $frontendUp.TcpTestSucceeded) {
            Write-Output "Starting frontend dev server on :5173..."
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "cd /d `"$frontendDir`" && npm run dev -- --host 0.0.0.0 --port 5173" -WindowStyle Minimized | Out-Null
            Start-Sleep -Seconds 3
        }
        else {
            Write-Output "Frontend already running on :5173"
        }
    }
    catch {
        Write-Warning "Could not validate/start frontend: $_"
    }
}
else {
    Write-Warning "Frontend directory not found at $frontendDir"
}

Write-Output "Waiting for API to become healthy..."
Start-Sleep -Seconds 5
try {
    $resp = Invoke-RestMethod http://localhost:8080/health -TimeoutSec 10
    Write-Output "Health OK: $($resp | ConvertTo-Json -Compress)"
}
catch {
    Write-Error "Health check failed: $_"
}
