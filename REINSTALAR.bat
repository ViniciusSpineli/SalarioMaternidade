@echo off
title Reinstalar dependencias - Controle Maternidade
cd /d "%~dp0"

echo ============================================================
echo   Reinstalando as dependencias do projeto
echo   (apaga node_modules corrompido e instala do zero)
echo ============================================================
echo.

if not exist "package.json" (
    echo [ERRO] package.json nao encontrado nesta pasta.
    echo.
    pause
    exit /b 1
)

echo Apagando a pasta node_modules...
if exist "node_modules" (
    rmdir /s /q "node_modules"
)
echo Feito.
echo.

REM Verificar pnpm
call pnpm --version >nul 2>&1
if errorlevel 1 (
    echo pnpm nao encontrado. Instalando...
    call npm install -g pnpm
    if errorlevel 1 (
        echo [ERRO] Nao foi possivel instalar o pnpm.
        echo.
        pause
        exit /b 1
    )
)

echo Instalando dependencias (pode levar alguns minutos)...
echo.
call pnpm install
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar as dependencias.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Dependencias reinstaladas com sucesso!
echo   Agora voce ja pode usar o INICIAR.bat normalmente.
echo ============================================================
echo.
pause
