Write-Host "🔄 Stopping any processes on ports 3000 and 5000..." -ForegroundColor Yellow

# Kill processes on port 3000 (frontend)
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($port3000) {
    Stop-Process -Id $port3000 -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Killed process on port 3000" -ForegroundColor Green
}

# Kill processes on port 5000 (backend)
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($port5000) {
    Stop-Process -Id $port5000 -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Killed process on port 5000" -ForegroundColor Green
}

Write-Host "`n🚀 Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm install; npm run dev"

Write-Host "`n🚀 Starting frontend..." -ForegroundColor Cyan
npm install
npm run dev