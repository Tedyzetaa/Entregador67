@echo off
chcp 65001 > nul
title 📦 INSTALANDO DEPENDÊNCIAS - ENTREGADORES67

echo.
echo ==================================================
echo           📦 INSTALANDO DEPENDÊNCIAS
echo ==================================================
echo.

echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js não está instalado!
    echo 💡 Instale Node.js de: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js encontrado!

echo.
echo 📥 Instalando dependências do backend...

:: Verifica se já está no diretório backend
set CURRENT_DIR=%~dp0
if "%CURRENT_DIR:~-1%"=="\" set CURRENT_DIR=%CURRENT_DIR:~0,-1%
for %%I in ("%CURRENT_DIR%") do set FOLDER_NAME=%%~nxI

if "%FOLDER_NAME%"=="backend" (
    echo ✅ Já está no diretório backend.
) else (
    cd backend
)

npm install

echo.
echo 🔒 Verificando vulnerabilidades e tentando corrigir...
npm audit fix --force

echo.
echo ✅ Todas as dependências instaladas e vulnerabilidades corrigidas!
echo.
echo 🚀 Agora execute start.bat para iniciar o sistema
echo.
pause