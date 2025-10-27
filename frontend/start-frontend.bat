@echo off
chcp 65001 > nul
title 🌐 ENTREGADORES 67 - FRONTEND
color 0B

echo.
echo ==================================================
echo            🌐 FRONTEND ENTREGADORES 67
echo ==================================================
echo.

if not exist "index.html" (
    echo ❌ ERRO: Arquivo index.html não encontrado!
    pause
    exit /b 1
)

echo 🌐 Abrindo site no navegador...
start "" "index.html"

echo.
echo ✅ Frontend aberto no navegador!
echo 📍 Arquivo: index.html
echo.
echo 💡 Certifique-se de que o backend está rodando em:
echo    http://localhost:3000
echo.
pause