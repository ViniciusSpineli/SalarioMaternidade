@echo off
REM ============================================================
REM  Ajudante do INICIAR.bat: espera o servidor subir na porta
REM  3000 e abre o navegador automaticamente. Nao rode sozinho.
REM ============================================================
set "PORT=3000"

REM Tenta por ate 60 segundos conectar na porta antes de abrir
for /l %%i in (1,1,60) do (
    powershell -NoProfile -Command "try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('localhost', %PORT%); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        start "" "http://localhost:%PORT%"
        exit /b 0
    )
    timeout /t 1 /nobreak >nul
)

REM Se nao respondeu em 60s, abre mesmo assim como ultimo recurso
start "" "http://localhost:%PORT%"
exit /b 0
