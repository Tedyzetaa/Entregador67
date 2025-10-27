# **Entregadores 67 \- Sistema de Gestão de Entregas**

Sistema completo para gestão de entregadores e pedidos do Entregadores 67, incluindo cadastro de entregadores, sistema de pedidos, controle de status e estatísticas em tempo real.

---

## **📊 Status do Projeto**

✅ PRODUÇÃO \- Versão 1.2.0

Frontend: `frontend/index.html` (Executado via Live Server)  
Backend: `http://localhost:3000`  
Banco de Dados: Firebase Firestore (Produção)

---

## **🚀 Nova Versão 1.2.0 \- Sistema Completo em Produção**

Data: 15/01/2024  
Status: ✅ EM PRODUÇÃO \- 100% FUNCIONAL

### **Principais Realizações:**

✅ Firebase Firestore Integrado \- Dados salvos permanentemente  
✅ Sistema de Cadastro Otimizado \- Campos CNH simplificados para Sim/Não  
✅ Veículo Bicicleta Adicionado \- Nova opção para entregadores  
✅ Backend Node.js Robustecido \- API REST completa e estável  
✅ Interface Responsiva \- Funciona em desktop e mobile  
✅ Sistema Híbrido Inteligente \- Fallback automático para memória se Firebase falhar

---

## **📋 Sistema de Cadastro \- Campos Atualizados**

### **Informações Pessoais:**

* Nome Completo  
* CPF (com validação)  
* Telefone (com formatação automática)

### **Veículo e Documentação:**

* Tipo de Veículo:  
  * 🏍️ Moto  
  * 🚗 Carro  
  * 🚴 Bicicleta (NOVO)  
  * 🚚 Caminhão  
* CNH:  
  * ✅ Sim (mostra campo para número da CNH)  
  * ❌ Não (oculta campo da CNH)

### **Endereço e Disponibilidade:**

* Endereço Completo  
* Cidade, Estado, CEP  
* Disponibilidade (Flexível, Horário Comercial, Finais de Semana)

---

## **🏗️ Arquitetura do Sistema**

`text`

`Frontend (HTML/CSS/JS) → Backend (Node.js/Express) → Firebase Firestore`

       `↓                      ↓                       ↓`

   `Interface           API REST (localhost:3000)    Banco de Dados`

   `do Usuário          • Cadastro                   em Nuvem`

   `• Formulários       • Pedidos`

   `• Dashboard         • Estatísticas`

---

## **🛠️ Tecnologias Utilizadas**

### **Frontend:**

* HTML5 \- Estrutura semântica  
* CSS3 \- Estilos responsivos  
* JavaScript ES6+ \- Lógica de aplicação  
* Live Server \- Servidor de desenvolvimento

### **Backend:**

* Node.js \- Runtime JavaScript  
* Express.js \- Framework web  
* Firebase Admin SDK \- Integração com Firestore  
* CORS \- Comunicação entre domínios

### **Banco de Dados:**

* Firebase Firestore \- Banco de dados NoSQL  
* Coleções:  
  * `entregadores` \- Cadastro completo  
  * `pedidos` \- Sistema de pedidos  
  * `health` \- Monitoramento do sistema

---

## **📁 Estrutura do Projeto**

`text`

`entregador67/`

`├── 📂 backend/`

`│   ├── server.js              # Servidor principal`

`│   ├── package.json           # Dependências do backend`

`│   ├── firebase-config.json   # Configuração Firebase`

`│   ├── init-database.js       # Inicialização do banco`

`│   └── start-backend.bat      # Script de inicialização`

`│`

`├── 📂 frontend/`

`│   ├── index.html             # Página principal`

`│   ├── styles.css             # Estilos`

`│   ├── js/`

`│   │   ├── app.js             # Lógica principal`

`│   │   ├── auth.js            # Autenticação`

`│   │   └── script.js          # Utilitários`

`│   └── start-frontend.bat     # Script de inicialização`

`│`

`├── 📂 env/`

`├── start.bat                  # Inicializador completo`

`└── README.md                  # Este arquivo`

---

## **🚀 Como Executar o Sistema**

### **Execução Rápida (Recomendado):**

`bash`

`# Execute o inicializador completo`

`start.bat`

### **Execução Manual:**

`bash`

`# 1. Iniciar Backend`

`cd backend`

`node server.js`

`# 2. Iniciar Frontend`

`cd frontend`

`# Abra index.html no navegador ou use Live Server`

### **URLs do Sistema:**

* Frontend: `frontend/index.html`  
* Backend: `http://localhost:3000`  
* Health Check: `http://localhost:3000/health`  
* Status Firebase: `http://localhost:3000/firebase-status`

---

## **⚙️ Configuração de Ambiente**

### **Firebase Configuration (`firebase-config.json`):**

`json`

`{`

  `"type": "service_account",`

  `"project_id": "entregador67-859a4",`

  `"private_key_id": "12685b9bf66287a7aaf250",`

  `"private_key": "-----BEGIN PRIVATE KEY-----\n...",`

  `"client_email": "firebase-adminsdk-xxxxx@entregador67-859a4.iam.gserviceaccount.com",`

  `"client_id": "314820422641",`

  `"auth_uri": "https://accounts.google.com/o/oauth2/auth",`

  `"token_uri": "https://oauth2.googleapis.com/token",`

  `"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",`

  `"client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40entregador67-859a4.iam.gserviceaccount.com",`

  `"universe_domain": "googleapis.com"`

`}`

---

## **📊 API Endpoints Disponíveis**

### **Gestão de Entregadores:**

* `POST /cadastro` \- Cadastrar novo entregador  
* `GET /entregadores` \- Listar entregadores (filtros: status, ativo)

### **Sistema de Pedidos:**

* `GET /pedidos` \- Listar pedidos (filtros: status, entregadorId)  
* `POST /pedidos` \- Criar novo pedido  
* `POST /pedidos/:id/aceitar` \- Aceitar pedido  
* `PATCH /pedidos/:id/status` \- Atualizar status do pedido

### **Monitoramento:**

* `GET /health` \- Status do servidor e banco  
* `GET /estatisticas` \- Estatísticas do sistema  
* `GET /firebase-status` \- Status da conexão Firebase

---

## **🎯 Fluxo do Sistema**

### **Para Entregadores:**

`text`

`Cadastro → Aprovação → Disponibilidade → Aceitar Pedidos → Atualizar Status → Entrega`

### **Para Pedidos:**

`text`

`Criação → Disponibilidade → Aceitação → Coleta → Entrega → Finalização`

---

## **🔄 Status de Pedidos**

* 📝 Pendente \- Aguardando aceitação  
* ✅ Aceito \- Entregador designado  
* 📦 Coletado \- Produto coletado no local  
* 🚚 Em Trânsito \- A caminho da entrega  
* 🎉 Entregue \- Entrega concluída  
* ❌ Cancelado \- Pedido cancelado

---

## **📈 Funcionalidades Implementadas**

### **✅ Sistema Completo de Cadastro:**

* Validação de CPF único  
* Campos condicionais (CNH)  
* Opções de veículo atualizadas  
* Formatação automática de telefone/CPF

### **✅ Gestão de Pedidos:**

* Aceitação por entregadores  
* Atualização de status em tempo real  
* Filtros por status e entregador  
* Histórico completo

### **✅ Estatísticas em Tempo Real:**

* Total de entregadores ativos  
* Pedidos por status  
* Métricas financeiras  
* Taxa de entrega

### **✅ Sistema Híbrido Inteligente:**

* Firebase Firestore (produção)  
* Fallback para memória (desenvolvimento)  
* Migração automática entre modos

---

## **🛡️ Segurança e Validações**

* Validação de CPF \- Impede duplicatas  
* Campos Obrigatórios \- Validação no frontend e backend  
* Firebase Security Rules \- Proteção do banco de dados  
* CORS Configurado \- Comunicação segura entre frontend/backend

---

## **📱 Responsividade**

* 📱 Mobile First \- Interface otimizada para celulares  
* 💻 Desktop \- Layout adaptativo para telas maiores  
* 🎯 Touch-Friendly \- Botões e controles otimizados para touch

---

## **🔧 Comandos Úteis**

### **Inicialização do Banco:**

`bash`

`cd backend`

`node init-database.js`

### **Verificar Dependências:**

`bash`

`cd backend`

`npm list`

### **Testar Conexão Firebase:**

`bash`

`cd backend`

`node -e "const admin = require('firebase-admin'); const serviceAccount = require('./firebase-config.json'); admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }); console.log('✅ Firebase configurado!');"`

---

## **🐛 Solução de Problemas**

### **Erro Comum: Firebase Não Conecta**

`bash`

`# 1. Verificar configuração`

`node init-simple.js`

`# 2. Reinstalar dependências`

`cd backend`

`npm install firebase-admin@^11.11.0 --save`

`# 3. Verificar chave privada`

`# A chave deve estar completa no firebase-config.json`

### **Erro: Módulos Não Encontrados**

`bash`

`cd backend`

`npm install protobufjs@^7.2.4 --save`

---

## **📞 Suporte e Monitoramento**

### **Status do Sistema:**

* ✅ Backend: Operacional em `localhost:3000`  
* ✅ Firebase: Conectado e sincronizado  
* ✅ Frontend: Interface responsiva  
* ✅ Banco de Dados: Firestore ativo

### **Monitoramento:**

* Health Check automático  
* Logs detalhados no console  
* Estatísticas em tempo real  
* Status da conexão Firebase

---

## **🔄 Histórico de Versões**

### **Versão 1.2.0 \- Sistema Otimizado**

Data: 15/01/2024

* ✅ Campo CNH transformado em select Sim/Não  
* ✅ Veículo "Bicicleta" adicionado às opções  
* ✅ Sistema híbrido Firebase/Memória  
* ✅ Interface responsiva melhorada

### **Versão 1.1.0 \- Firebase Integration**

Data: 15/01/2024

* ✅ Integração com Firebase Firestore  
* ✅ Sistema de cadastro permanente  
* ✅ API REST completa  
* ✅ Scripts de inicialização

### **Versão 1.0.0 \- Base do Sistema**

Data: 15/01/2024

* ✅ Estrutura inicial do projeto  
* ✅ Sistema de pedidos básico  
* ✅ Interface inicial  
* ✅ Dados em memória

---

## **🎯 Próximas Atualizações**

### **Em Desenvolvimento:**

* Sistema de autenticação para entregadores  
* Notificações em tempo real  
* Dashboard administrativo  
* Relatórios financeiros detalhados

### **Planejado:**

* App mobile para entregadores  
* Integração com mapas  
* Sistema de pagamentos  
* Avaliação de entregadores

---

## **📄 Licença**

Este projeto é de uso interno do Entregadores 67\.  
Desenvolvido para otimizar a gestão de entregas e entregadores.

---

## **💡 Desenvolvido com**

Tecnologia: Node.js \+ Express \+ Firebase  
Arquitetura: API REST \+ Frontend SPA  
Banco: Firebase Firestore (NoSQL)  
Deploy: Local \+ Cloud Firestore

---

SISTEMA 100% OPERACIONAL \- PRONTO PARA USO EM PRODUÇÃO\!

Sistema desenvolvido para modernizar e escalar as operações do Entregadores 67

"# Entregador67" 
