@echo off
echo Installing LocalMCP...
echo.

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    exit /b 1
)

:: Check for pnpm
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing pnpm...
    npm install -g pnpm
)

:: Install dependencies
echo Installing dependencies...
cd ..
pnpm install

:: Build extension
echo Building Chrome extension...
cd packages\extension
pnpm build

:: Generate auth token
echo.
echo Generating authentication token...
set /p AUTH_TOKEN=<nul
for /f "tokens=*" %%a in ('powershell -Command "[guid]::NewGuid().ToString()"') do set AUTH_TOKEN=%%a
echo AUTH_TOKEN=%AUTH_TOKEN%

:: Create .env file
echo Creating .env file...
cd ..\server
echo AUTH_TOKEN=%AUTH_TOKEN% > .env
echo PORT=3000 >> .env

echo.
echo Installation complete!
echo.
echo Your authentication token is: %AUTH_TOKEN%
echo Please save this token - you'll need it to connect the Chrome extension.
echo.
echo Next steps:
echo 1. Load the extension in Chrome from: packages\extension\dist
echo 2. Start the server: pnpm --filter @localmcp/server start
echo 3. Connect using the token above
pause