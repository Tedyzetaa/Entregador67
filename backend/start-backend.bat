@echo off
chcp 65001 > nul
title 🚀 BACKEND ENTREGADORES 67

echo.
echo ==================================================
echo           🚀 BACKEND ENTREGADORES 67
echo ==================================================
echo.

echo 📡 Iniciando servidor backend...
cd /d "%~dp0"

:: Verificar se as dependências estão instaladas
if not exist "node_modules" (
  echo 📦 Instalando dependências...
  npm install
)

echo 🚀 Iniciando servidor Node.js...
node server.js

echo.
echo ❌ Servidor parou. Pressione qualquer tecla para fechar...
pause >nul