@echo off
title Controle de Salario-Maternidade
REM ==================== CONTROLE DE SALARIO-MATERNIDADE ====================
REM Script para iniciar o sistema (banco SQLite local, sem MySQL)
REM ========================================================================

REM Garante que o script rode na propria pasta, mesmo com duplo-clique
cd /d "%~dp0"

echo ============================================================
echo   Controle de Salario-Maternidade
echo   Sistema de Gestao de Clientes
echo ============================================================
echo.

REM Verificar se esta no diretorio correto
if not exist "package.json" (
    echo [ERRO] Arquivo package.json nao encontrado.
    echo Este arquivo deve ficar na pasta raiz do projeto.
    echo.
    pause
    exit /b 1
)

REM Verificar Node.js
echo Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado.
    echo Baixe e instale em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Verificar pnpm
echo Verificando pnpm...
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

REM Instalar dependencias se necessario
if not exist "node_modules" (
    echo Instalando dependencias do projeto...
    echo Isso pode levar alguns minutos...
    echo.
    call pnpm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias.
        echo.
        pause
        exit /b 1
    )
    echo.
)

REM Iniciar o servidor
echo ============================================================
echo   Iniciando o servidor...
echo   Acesse em: http://localhost:3000
echo   (se a porta 3000 estiver ocupada, veja a porta real no log)
echo.
echo   Para PARAR: feche esta janela ou pressione Ctrl+C
echo ============================================================
echo.

call pnpm dev

echo.
echo O servidor foi encerrado.
pause
