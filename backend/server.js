const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicialização do Firebase
let db = null;
let firebaseInitialized = false;

try {
  const admin = require('firebase-admin');
  
  // Verificar se o arquivo de configuração existe
  const serviceAccount = require('./firebase-config.json');
  
  // Inicializar Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  db = admin.firestore();
  firebaseInitialized = true;
  console.log('✅ Firebase inicializado com sucesso!');
  
} catch (error) {
  console.log('⚠️  Firebase não configurado. Usando dados em memória.');
  console.log('💡 Motivo:', error.message);
  firebaseInitialized = false;
}

// Dados em memória (apenas como fallback)
let entregadores = [];
let nextEntregadorId = 1;
let pedidos = [];
let nextPedidoId = 1;

// Health Check
app.get('/health', async (req, res) => {
  try {
    let firebaseStatus = 'disabled';
    
    if (firebaseInitialized) {
      try {
        // Testar conexão com Firebase
        await db.collection('health').doc('check').set({
          timestamp: new Date().toISOString(),
          status: 'active'
        });
        firebaseStatus = 'connected';
      } catch (error) {
        firebaseStatus = 'error';
      }
    }

    let stats = {};
    
    if (firebaseInitialized && firebaseStatus === 'connected') {
      // Estatísticas do Firebase
      const [entregadoresSnapshot, pedidosSnapshot] = await Promise.all([
        db.collection('entregadores').get(),
        db.collection('pedidos').get()
      ]);
      
      stats = {
        entregadores: entregadoresSnapshot.size,
        pedidos: pedidosSnapshot.size,
        pedidosPendentes: pedidosSnapshot.docs.filter(doc => doc.data().status === 'pendente').length
      };
    } else {
      // Estatísticas em memória
      stats = {
        entregadores: entregadores.length,
        pedidos: pedidos.length,
        pedidosPendentes: pedidos.filter(p => p.status === 'pendente').length
      };
    }

    res.json({ 
      status: 'OK', 
      message: '✅ Servidor backend rodando!',
      timestamp: new Date().toISOString(),
      database: firebaseStatus,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: error.message 
    });
  }
});

// CADASTRO COM FIREBASE
app.post('/cadastro', async (req, res) => {
  try {
    console.log('📥 Recebendo cadastro...');
    const dados = req.body;
    
    // Campos obrigatórios atualizados (cnh não é mais obrigatório)
    const camposObrigatorios = ['nome', 'cpf', 'telefone', 'veiculo', 'endereco', 'cidade', 'estado', 'cep', 'disponibilidade', 'possuiCnh'];
    const camposFaltantes = camposObrigatorios.filter(campo => !dados[campo]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${camposFaltantes.join(', ')}`
      });
    }

    const cpfLimpo = dados.cpf.replace(/\D/g, '');

    // Verificar CPF existente (mantém igual)
    const cpfExistente = await db.collection('entregadores')
      .where('cpf', '==', cpfLimpo)
      .get();
    
    if (!cpfExistente.empty) {
      return res.status(400).json({
        success: false,
        message: 'CPF já cadastrado no sistema'
      });
    }

    // Criar entregador com novos campos
    const novoEntregador = {
      nome: dados.nome,
      cpf: cpfLimpo,
      telefone: dados.telefone.replace(/\D/g, ''),
      veiculo: dados.veiculo,
      endereco: dados.endereco,
      cidade: dados.cidade,
      estado: dados.estado,
      cep: dados.cep,
      disponibilidade: dados.disponibilidade,
      possuiCnh: dados.possuiCnh, // Novo campo
      cnh: dados.cnh || null,     // CNH pode ser null agora
      dataCadastro: new Date().toISOString(),
      status: 'pendente',
      verificado: false,
      ativo: true
    };

    // Salvar no Firestore (mantém igual)
    const docRef = await db.collection('entregadores').add(novoEntregador);
    const resultado = { 
      id: docRef.id, 
      ...novoEntregador 
    };

    console.log('✅ Cadastro salvo no Firestore:', dados.nome);

    res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso! Aguarde aprovação.',
      id: resultado.id,
      dados: resultado
    });

  } catch (error) {
    console.error('❌ Erro no cadastro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
});

// LISTAR PEDIDOS COM FIREBASE
app.get('/pedidos', async (req, res) => {
  try {
    const { status, entregadorId } = req.query;
    
    let pedidosData = [];

    if (firebaseInitialized) {
      try {
        // Buscar do Firebase
        let pedidosRef = db.collection('pedidos');
        
        const snapshot = await pedidosRef.get();
        pedidosData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));

        // Aplicar filtros
        if (status) {
          pedidosData = pedidosData.filter(p => p.status === status);
        }
        if (entregadorId) {
          pedidosData = pedidosData.filter(p => p.entregadorId === entregadorId);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar pedidos do Firebase:', error);
        pedidosData = pedidos; // Fallback para memória
      }
    } else {
      // Buscar da memória
      pedidosData = pedidos;
      if (status) {
        pedidosData = pedidosData.filter(p => p.status === status);
      }
      if (entregadorId) {
        pedidosData = pedidosData.filter(p => p.entregadorId === parseInt(entregadorId));
      }
    }

    res.json({
      success: true,
      data: pedidosData,
      total: pedidosData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pedidos'
    });
  }
});

// CRIAR PEDIDO COM FIREBASE
app.post('/pedidos', async (req, res) => {
  try {
    const {
      clienteNome,
      clienteTelefone,
      enderecoColeta,
      enderecoEntrega,
      itens,
      valor,
      observacoes,
      urgente = false
    } = req.body;

    // Validação
    if (!clienteNome || !clienteTelefone || !enderecoColeta || !enderecoEntrega || !valor) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios faltando'
      });
    }

    const novoPedido = {
      clienteNome,
      clienteTelefone: clienteTelefone.replace(/\D/g, ''),
      enderecoColeta,
      enderecoEntrega,
      itens: itens || [],
      valor: parseFloat(valor),
      observacoes: observacoes || '',
      urgente: Boolean(urgente),
      status: 'pendente',
      entregadorId: null,
      entregadorNome: null,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    let resultado;

    if (firebaseInitialized) {
      try {
        // Salvar no Firebase
        const docRef = await db.collection('pedidos').add(novoPedido);
        resultado = { 
          id: docRef.id, 
          ...novoPedido 
        };
        console.log('📦 Pedido salvo no Firebase:', docRef.id);
      } catch (error) {
        console.error('❌ Erro ao salvar pedido no Firebase:', error);
        // Fallback para memória
        novoPedido.id = nextPedidoId++;
        pedidos.push(novoPedido);
        resultado = novoPedido;
      }
    } else {
      // Salvar em memória
      novoPedido.id = nextPedidoId++;
      pedidos.push(novoPedido);
      resultado = novoPedido;
    }

    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso!',
      pedido: resultado
    });

  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar pedido'
    });
  }
});

// [MANTENHA AS OUTRAS ROTAS COMO ACEITAR PEDIDO, ESTATÍSTICAS, ENTREGADORES, ETC...]
// ... (o restante do código das outras rotas permanece igual ao anterior)

// ROTA RAIZ
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Entregadores 67 - Sistema de Entregas',
    version: '1.0.0',
    database: firebaseInitialized ? 'Firebase' : 'Memória',
    endpoints: {
      health: 'GET /health',
      cadastro: 'POST /cadastro',
      pedidos: {
        listar: 'GET /pedidos',
        criar: 'POST /pedidos',
        aceitar: 'POST /pedidos/:id/aceitar',
        status: 'PATCH /pedidos/:id/status'
      },
      estatisticas: 'GET /estatisticas',
      entregadores: 'GET /entregadores'
    },
    timestamp: new Date().toISOString()
  });
});

// MIDDLEWARE PARA ROTAS NÃO ENCONTRADAS
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.path
  });
});

// MIDDLEWARE DE ERRO GLOBAL
app.use((error, req, res, next) => {
  console.error('❌ Erro global:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor: ' + error.message
  });
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 ENTREGADORES 67 - SISTEMA DE ENTREGAS');
  console.log('='.repeat(70));
  console.log(`📍 Servidor rodando: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Cadastro: POST http://localhost:${PORT}/cadastro`);
  console.log(`📦 Pedidos: GET http://localhost:${PORT}/pedidos`);
  console.log(`📊 Estatísticas: GET http://localhost:${PORT}/estatisticas`);
  console.log('='.repeat(70));
  console.log(`⚡ Banco de dados: ${firebaseInitialized ? 'Firebase (Produção)' : 'Memória (Desenvolvimento)'}`);
  console.log('='.repeat(70));
  
  // Criar dados de exemplo apenas se não estiver usando Firebase
  if (!firebaseInitialized) {
    criarDadosExemplo();
  }
});

// CRIAR DADOS DE EXEMPLO (apenas para memória)
function criarDadosExemplo() {
  // Entregadores exemplo
  entregadores.push({
    id: nextEntregadorId++,
    nome: "João Silva",
    cpf: "12345678901",
    telefone: "67999999999",
    veiculo: "moto",
    endereco: "Rua Exemplo, 123",
    cidade: "Ivinhema",
    estado: "MS",
    cep: "79740000",
    disponibilidade: "flexivel",
    status: "aprovado",
    verificado: true,
    ativo: true,
    dataCadastro: new Date().toISOString()
  });

  // Pedidos exemplo
  pedidos.push({
    id: nextPedidoId++,
    clienteNome: "Maria Santos",
    clienteTelefone: "67988888888",
    enderecoColeta: "Restaurante Sabor Caseiro - Av. Principal, 456",
    enderecoEntrega: "Rua das Flores, 789 - Centro",
    itens: ["2x Pizza Calabresa", "1x Coca-Cola 2L"],
    valor: 45.50,
    observacoes: "Entregar sem campainha, apenas WhatsApp",
    status: "pendente",
    dataCriacao: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString()
  });

  console.log('📋 Dados de exemplo criados para demonstração');
}