@echo off
chcp 65001 > nul
title 🚀 ENTREGADORES 67 - SISTEMA COMPLETO
color 0A

echo.
echo ==================================================
echo            🚀 ENTREGADORES 67
echo ==================================================
echo    Iniciando Sistema Completo...
echo ==================================================
echo.

:: Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js não encontrado!
    echo Instale o Node.js ou ative o ambiente conda.
    echo.
    pause
    exit /b 1
)

:: Verificar se as pastas existem
if not exist "backend" (
    echo ❌ ERRO: Pasta 'backend' não encontrada!
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ ERRO: Pasta 'frontend' não encontrada!
    pause
    exit /b 1
)

echo ✅ Verificações concluídas com sucesso!
echo.

:: Iniciar backend em uma nova janela
echo 📡 Iniciando Backend (servidor API)...
start "🚀 Entregadores67 - Backend" cmd /k "cd /d %~dp0backend && node server.js"

echo ⏳ Aguardando backend inicializar...
timeout /t 5 /nobreak >nul

:: Iniciar frontend
echo 🌐 Iniciando Frontend (site)...
cd frontend
start "" "index.html"

echo.
echo ==================================================
echo            ✅ SISTEMA INICIADO!
echo ==================================================
echo.
echo 📍 Backend:  http://localhost:3000
echo 🌐 Frontend: frontend/index.html (aberto no navegador)
echo.
echo 🛑 Para parar o sistema: Feche as janelas do terminal
echo.
echo ==================================================
pause