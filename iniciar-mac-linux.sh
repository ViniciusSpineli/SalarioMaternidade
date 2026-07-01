#!/bin/bash

# Script de inicialização rápida para Mac/Linux
# Este script inicia o sistema de Controle de Salário-Maternidade

echo "========================================"
echo "Controle de Salario-Maternidade"
echo "Sistema de Gestao de Clientes"
echo "========================================"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "ERRO: Node.js nao encontrado!"
    echo "Baixe em: https://nodejs.org/"
    exit 1
fi

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "AVISO: pnpm nao encontrado. Instalando..."
    npm install -g pnpm
fi

echo ""
echo "Verificando dependencias..."
pnpm install --silent

echo ""
echo "Iniciando servidor..."
echo ""
echo "========================================"
echo "Sistema disponivel em: http://localhost:3000"
echo "Pressione Ctrl+C para parar"
echo "========================================"
echo ""

pnpm dev
