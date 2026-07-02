@echo off
chcp 65001 >nul
title Atualizar Projeto - Controle Maternidade

echo ============================================
echo   Atualizando o projeto a partir do GitHub
echo ============================================
echo.

REM Vai para a pasta onde este .bat esta salvo
cd /d "%~dp0"

REM Verifica se esta pasta e um repositorio git
if not exist ".git" (
    echo [ERRO] Esta pasta nao e um repositorio git.
    echo Coloque este arquivo dentro da pasta do projeto ja clonado.
    echo.
    pause
    exit /b 1
)

echo Buscando alteracoes...
echo.
git pull

echo.
if %errorlevel% neq 0 (
    echo ============================================
    echo   [ATENCAO] Ocorreu um erro no git pull.
    echo   Verifique as mensagens acima.
    echo ============================================
) else (
    echo ============================================
    echo   Projeto atualizado com sucesso!
    echo ============================================
)

echo.
pause
