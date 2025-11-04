@echo off
setlocal enabledelayedexpansion

echo.
echo ======================================
echo GitHub Integration Testing Script
echo ======================================
echo.

REM Test 1: Check if backend is running
echo [TEST 1] Checking if backend server is running...
curl -s http://localhost:5000/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ^[OK^] Backend running on port 5000
) else (
    echo [ERROR] Backend NOT running on port 5000
    echo Start with: cd server ^&^& npm run dev
    exit /b 1
)

REM Test 2: Check if frontend is running
echo [TEST 2] Checking if frontend server is running...
curl -s http://localhost:3000 > nul 2>&1
if %errorlevel% equ 0 (
    echo ^[OK^] Frontend running on port 3000
) else (
    echo [ERROR] Frontend NOT running on port 3000
    echo Start with: npm run dev
    exit /b 1
)

echo.
echo ======================================
echo Manual Testing Steps
echo ======================================
echo.
echo 1. Open http://localhost:3000 in browser
echo.
echo 2. Login to your account
echo.
echo 3. Go to Deployments page
echo    - Click "New Deployment" button
echo.
echo 4. Select "GitHub" tab
echo.
echo 5. Click "Connect GitHub" button
echo    - You will be redirected to GitHub authorization
echo.
echo 6. Click "Authorize" on GitHub
echo    - GitHub redirects back to deployment page
echo.
echo 7. Open DevTools (F12) Console and look for:
echo    - "API Client: Checking GitHub connection status..."
echo    - "API Client: Connection status: { connected: true, ... }"
echo    - "API Client: Fetching GitHub repositories..."
echo    - "API Client: Got repositories count: X"
echo.
echo 8. Check backend terminal (server/) for logs:
echo    - "=== FETCH REPOSITORIES ==="
echo    - "User ID: ..."
echo    - "GitHub integration found: true"
echo    - "GitHub username: your-username"
echo    - "GitHub API response - repos count: X"
echo.
echo 9. Verify repositories appear in dialog
echo    - See list of your GitHub repositories
echo    - Search/filter repositories
echo    - Select and see branches
echo.
echo 10. Try deploying a repository!
echo.
echo [SUCCESS] All systems ready for testing!
echo.
pause
