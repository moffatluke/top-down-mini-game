@echo off
echo 🎮 Starting Llama Knight Adventure...
echo.
echo This will open Chrome with security flags disabled to bypass CORS issues.
echo ONLY use this for local development!
echo.
pause
echo Starting game...

REM Find Chrome installation
set CHROME_PATH=""
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set CHROME_PATH="%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if %CHROME_PATH%=="" (
    echo Chrome not found! Opening with default browser...
    start zelda_game.html
) else (
    echo Opening with Chrome (CORS disabled)...
    %CHROME_PATH% --disable-web-security --disable-features=VizDisplayCompositor --user-data-dir="%TEMP%\chrome_dev" --allow-file-access-from-files zelda_game.html
)

echo.
echo If the game shows a blank screen or errors:
echo 1. Try the debug_test.html file instead
echo 2. Check the browser console (F12) for errors
echo 3. Or run a local web server
echo.
pause