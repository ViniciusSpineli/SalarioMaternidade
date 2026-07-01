@echo off
REM Script de inicialização rápida para Windows
REM Este script inicia o sistema de Controle de Salário-Maternidade

echo ========================================
echo Controle de Salario-Maternidade
echo Sistema de Gestao de Clientes
echo ========================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se pnpm está instalado
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo AVISO: pnpm nao encontrado. Instalando...
    npm install -g pnpm
)

echo.
echo Verificando dependencias...
pnpm install --silent

echo.
echo Iniciando servidor...
echo.
echo ========================================
echo Sistema disponivel em: http://localhost:3000
echo Pressione Ctrl+C para parar
echo ========================================
echo.

pnpm dev

pause
