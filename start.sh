#!/bin/bash
echo "Iniciando Entregadores 67 Local..."

echo "Instalando dependencias do backend..."
cd backend
npm install

echo "Iniciando servidor backend..."
node server.js &

echo "Aguardando servidor backend iniciar..."
sleep 5

echo "Abrindo frontend no navegador..."
cd ../frontend
open index.html  # Para Mac
# xdg-open index.html  # Para Linux

echo "✅ Sistema iniciado!"
echo "Backend: http://localhost:3000"
echo "Frontend: frontend/index.html"