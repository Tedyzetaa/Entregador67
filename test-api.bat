@echo off
echo Testando API Entregadores 67...

echo.
echo 1. Testando health check...
curl http://localhost:3000/health

echo.
echo 2. Testando cadastro...
curl -X POST http://localhost:3000/cadastro -H "Content-Type: application/json" -d "{\"nome\":\"Teste Silva\",\"cpf\":\"12345678901\",\"telefone\":\"67999999999\",\"veiculo\":\"moto\",\"endereco\":\"Rua Teste, 123\",\"cidade\":\"Ivinhema\",\"estado\":\"MS\",\"cep\":\"79740000\",\"disponibilidade\":\"manha\"}"

echo.
echo 3. Listando cadastros...
curl http://localhost:3000/entregadores

echo.
echo ✅ Testes concluídos!
pause