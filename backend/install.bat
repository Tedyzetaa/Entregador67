@echo off
echo Instalando dependencias do backend Entregadores 67...

echo Verificando Node.js...
node --version
if errorlevel 1 (
    echo ❌ Node.js não encontrado!
    echo Instale o Node.js ou ative o ambiente conda correto.
    pause
    exit /b 1
)

echo Verificando npm...
npm --version
if errorlevel 1 (
    echo ❌ npm não encontrado!
    pause
    exit /b 1
)

echo Instalando dependencias...
npm install express cors

echo.
echo ✅ Dependencias instaladas com sucesso!
echo.
echo Para iniciar o servidor:
echo   node server.js
echo.
pause