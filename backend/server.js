// Adicione esta linha NO INÍCIO do seu server.js, após as importações
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== CORREÇÃO CORS - DEVE VIR ANTES DE QUALQUER MIDDLEWARE ==========
app.use(cors({
    origin: [
        'https://garagem67.vercel.app',
        'https://entregador67.vercel.app',
        'https://www.garagem67.vercel.app', 
        'https://www.entregador67.vercel.app',
        'http://localhost:8000',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080',
        'https://entregador67.vercel.app' // ADICIONE ESTA LINHA
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Middleware para lidar com preflight requests explicitamente
app.options('*', cors());

// ========== MIDDLEWARE PARA LOG DE REQUISIÇÕES CORS ==========
app.use((req, res, next) => {
    console.log('🌐 CORS - Origem:', req.headers.origin);
    console.log('🌐 CORS - Método:', req.method);
    console.log('🌐 CORS - Rota:', req.path);
    next();
});

// Middleware para parse JSON - DEVE VIR DEPOIS DO CORS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ... resto do seu código permanece igual

// Inicialização do Firebase
let db = null;
let firebaseInitialized = false;

try {
  const serviceAccount = require('./firebase-config.json');
  
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

// Dados em memória (fallback)
let users = [];
let nextUserId = 1;
let entregadores = [];
let nextEntregadorId = 1;
let pedidos = [];
let nextPedidoId = 1;

// ==================== MIDDLEWARES ====================

// Middleware de autenticação
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    
    // Buscar informações adicionais do usuário no Firestore
    if (firebaseInitialized) {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        req.user.role = userDoc.data().role || 'entregador';
        req.user.profileCompleted = userDoc.data().profileCompleted || false;
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
};

// Middleware para verificar se é admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Requer privilégios de administrador.'
    });
  }
};

// ==================== ROTAS DE AUTENTICAÇÃO E USUÁRIOS ====================

// Health Check
app.get('/health', async (req, res) => {
  try {
    let firebaseStatus = 'disabled';
    
    if (firebaseInitialized) {
      try {
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
      const [usersSnapshot, entregadoresSnapshot, pedidosSnapshot] = await Promise.all([
        db.collection('users').get(),
        db.collection('entregadores').get(),
        db.collection('pedidos').get()
      ]);
      
      stats = {
        users: usersSnapshot.size,
        entregadores: entregadoresSnapshot.size,
        pedidos: pedidosSnapshot.size,
        pedidosPendentes: pedidosSnapshot.docs.filter(doc => doc.data().status === 'pendente').length
      };
    } else {
      stats = {
        users: users.length,
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

// Registrar usuário (após login social)
app.post('/register-user', async (req, res) => {
  try {
    const { uid, email, name, role = 'entregador' } = req.body;

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: 'UID e email são obrigatórios'
      });
    }

    const userData = {
      email,
      name: name || '',
      role,
      profileCompleted: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    let result;

    if (firebaseInitialized) {
      const userRef = db.collection('users').doc(uid);
      await userRef.set(userData, { merge: true });
      result = { id: uid, ...userData };
    } else {
      const existingUser = users.find(u => u.id === uid);
      if (existingUser) {
        Object.assign(existingUser, userData);
        result = existingUser;
      } else {
        const newUser = { id: uid, ...userData };
        users.push(newUser);
        result = newUser;
      }
    }

    res.json({
      success: true,
      message: 'Usuário registrado/atualizado com sucesso',
      user: result
    });

  } catch (error) {
    console.error('❌ Erro ao registrar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
});

// ==================== ROTAS DE ENTREGADORES ====================

// Cadastro de entregador (completa perfil)
app.post('/cadastro', authenticate, async (req, res) => {
  try {
    console.log('📥 Recebendo cadastro de entregador...');
    const dados = req.body;
    
    const camposObrigatorios = ['nome', 'cpf', 'telefone', 'veiculo', 'endereco', 'cidade', 'estado', 'cep', 'disponibilidade', 'possuiCnh'];
    const camposFaltantes = camposObrigatorios.filter(campo => !dados[campo]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${camposFaltantes.join(', ')}`
      });
    }

    const cpfLimpo = dados.cpf.replace(/\D/g, '');

    // Verificar se já existe perfil para este usuário
    let entregadorExistente = null;
    
    if (firebaseInitialized) {
      const snapshot = await db.collection('entregadores')
        .where('userId', '==', req.user.uid)
        .get();
      
      if (!snapshot.empty) {
        entregadorExistente = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
    } else {
      entregadorExistente = entregadores.find(e => e.userId === req.user.uid);
    }

    if (entregadorExistente) {
      return res.status(400).json({
        success: false,
        message: 'Perfil de entregador já cadastrado para este usuário'
      });
    }

    // Verificar CPF existente
    let cpfExistente = false;
    
    if (firebaseInitialized) {
      const cpfSnapshot = await db.collection('entregadores')
        .where('cpf', '==', cpfLimpo)
        .get();
      
      cpfExistente = !cpfSnapshot.empty;
    } else {
      cpfExistente = entregadores.some(e => e.cpf === cpfLimpo);
    }

    if (cpfExistente) {
      return res.status(400).json({
        success: false,
        message: 'CPF já cadastrado no sistema'
      });
    }

    // Criar perfil do entregador
    const novoEntregador = {
      userId: req.user.uid,
      userEmail: req.user.email,
      nome: dados.nome,
      cpf: cpfLimpo,
      telefone: dados.telefone.replace(/\D/g, ''),
      veiculo: dados.veiculo,
      endereco: dados.endereco,
      cidade: dados.cidade,
      estado: dados.estado,
      cep: dados.cep,
      disponibilidade: dados.disponibilidade,
      possuiCnh: dados.possuiCnh,
      cnh: dados.cnh || null,
      dataCadastro: new Date().toISOString(),
      status: 'pendente',
      verificado: false,
      ativo: true
    };

    let resultado;

    if (firebaseInitialized) {
      const docRef = await db.collection('entregadores').add(novoEntregador);
      resultado = { id: docRef.id, ...novoEntregador };
      
      // Atualizar usuário para marcar perfil como completo
      await db.collection('users').doc(req.user.uid).update({
        profileCompleted: true
      });
    } else {
      novoEntregador.id = nextEntregadorId++;
      entregadores.push(novoEntregador);
      resultado = novoEntregador;
      
      // Atualizar usuário em memória
      const user = users.find(u => u.id === req.user.uid);
      if (user) {
        user.profileCompleted = true;
      }
    }

    console.log('✅ Perfil de entregador salvo:', dados.nome);

    res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso! Aguarde aprovação.',
      entregador: resultado
    });

  } catch (error) {
    console.error('❌ Erro no cadastro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor: ' + error.message
    });
  }
});

// Listar entregadores (apenas admin)
app.get('/entregadores', authenticate, isAdmin, async (req, res) => {
  try {
    let entregadoresData = [];

    if (firebaseInitialized) {
      const snapshot = await db.collection('entregadores').get();
      entregadoresData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    } else {
      entregadoresData = entregadores;
    }

    res.json({
      success: true,
      data: entregadoresData,
      total: entregadoresData.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar entregadores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar entregadores'
    });
  }
});

// ==================== ROTAS DE PEDIDOS ====================

// Criar pedido (apenas admin)
app.post('/pedidos', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('📥 Recebendo pedido do admin:', req.body);
    
    const { description, quantity } = req.body;

    if (!description || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Descrição e quantidade são obrigatórias'
      });
    }

    const novoPedido = {
      description,
      quantity: parseInt(quantity),
      status: 'pendente',
      createdBy: req.user.uid,
      createdByName: req.user.name || 'Administrador',
      acceptedBy: null,
      acceptedByName: null,
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      updatedAt: new Date().toISOString()
    };

    let resultado;

    if (firebaseInitialized) {
      const docRef = await db.collection('pedidos').add(novoPedido);
      resultado = { id: docRef.id, ...novoPedido };
      console.log('✅ Pedido salvo no Firebase:', docRef.id);
    } else {
      novoPedido.id = nextPedidoId++;
      pedidos.push(novoPedido);
      resultado = novoPedido;
      console.log('✅ Pedido salvo em memória:', novoPedido.id);
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
      message: 'Erro ao criar pedido: ' + error.message
    });
  }
});

// Listar pedidos (com filtros)
app.get('/pedidos', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    
    let pedidosData = [];

    if (firebaseInitialized) {
      let query = db.collection('pedidos');
      
      // Aplicar filtro de status se fornecido
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      pedidosData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    } else {
      pedidosData = pedidos;
      if (status) {
        pedidosData = pedidosData.filter(p => p.status === status);
      }
      pedidosData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Se for entregador, mostrar apenas pedidos pendentes ou aceitos por ele
    if (req.user.role === 'entregador') {
      pedidosData = pedidosData.filter(p => 
        p.status === 'pendente' || p.acceptedBy === req.user.uid
      );
    }

    res.json({
      success: true,
      data: pedidosData,
      total: pedidosData.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pedidos'
    });
  }
});

// Aceitar pedido (entregador)
app.post('/pedidos/:id/aceitar', authenticate, async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const userId = req.user.uid;
    const userName = req.user.name || 'Entregador';

    // Verificar se o usuário é entregador
    if (req.user.role !== 'entregador') {
      return res.status(403).json({
        success: false,
        message: 'Apenas entregadores podem aceitar pedidos'
      });
    }

    let pedido;

    if (firebaseInitialized) {
      const pedidoRef = db.collection('pedidos').doc(pedidoId);
      const pedidoDoc = await pedidoRef.get();
      
      if (!pedidoDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }

      pedido = pedidoDoc.data();

      // Verificar se o pedido já foi aceito
      if (pedido.status !== 'pendente') {
        return res.status(400).json({
          success: false,
          message: 'Pedido já foi aceito por outro entregador'
        });
      }

      // Atualizar pedido
      await pedidoRef.update({
        status: 'aceito',
        acceptedBy: userId,
        acceptedByName: userName,
        acceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      pedido = { id: pedidoDoc.id, ...pedidoDoc.data() };

    } else {
      pedido = pedidos.find(p => p.id == pedidoId);
      
      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }

      if (pedido.status !== 'pendente') {
        return res.status(400).json({
          success: false,
          message: 'Pedido já foi aceito por outro entregador'
        });
      }

      pedido.status = 'aceito';
      pedido.acceptedBy = userId;
      pedido.acceptedByName = userName;
      pedido.acceptedAt = new Date().toISOString();
      pedido.updatedAt = new Date().toISOString();
    }

    res.json({
      success: true,
      message: 'Pedido aceito com sucesso!',
      pedido: pedido
    });

  } catch (error) {
    console.error('❌ Erro ao aceitar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aceitar pedido: ' + error.message
    });
  }
});

// Atualizar status do pedido
app.patch('/pedidos/:id/status', authenticate, async (req, res) => {
  try {
    const pedidoId = req.params.id;
    const { status } = req.body;

    const statusValidos = ['pendente', 'aceito', 'em_rota', 'entregue', 'cancelado'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido'
      });
    }

    let pedido;

    if (firebaseInitialized) {
      const pedidoRef = db.collection('pedidos').doc(pedidoId);
      const pedidoDoc = await pedidoRef.get();
      
      if (!pedidoDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }

      pedido = pedidoDoc.data();

      // Verificar permissões
      if (req.user.role === 'entregador' && pedido.acceptedBy !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: 'Você só pode atualizar pedidos que aceitou'
        });
      }

      await pedidoRef.update({
        status: status,
        updatedAt: new Date().toISOString()
      });

      pedido = { id: pedidoDoc.id, ...pedidoDoc.data() };

    } else {
      pedido = pedidos.find(p => p.id == pedidoId);
      
      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }

      if (req.user.role === 'entregador' && pedido.acceptedBy !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: 'Você só pode atualizar pedidos que aceitou'
        });
      }

      pedido.status = status;
      pedido.updatedAt = new Date().toISOString();
    }

    res.json({
      success: true,
      message: 'Status do pedido atualizado com sucesso!',
      pedido: pedido
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status: ' + error.message
    });
  }
});

// ==================== ROTAS ADMIN ====================

// Criar usuário admin (endpoint especial)
app.post('/admin/create-admin', async (req, res) => {
  try {
    const { uid, email, name } = req.body;

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: 'UID e email são obrigatórios'
      });
    }

    const adminData = {
      email,
      name: name || 'Administrador',
      role: 'admin',
      profileCompleted: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    if (firebaseInitialized) {
      await db.collection('users').doc(uid).set(adminData, { merge: true });
    } else {
      const existingUser = users.find(u => u.id === uid);
      if (existingUser) {
        Object.assign(existingUser, adminData);
      } else {
        users.push({ id: uid, ...adminData });
      }
    }

    res.json({
      success: true,
      message: 'Usuário admin criado com sucesso!',
      user: adminData
    });

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar admin: ' + error.message
    });
  }
});

// Aprovar/rejeitar entregador (admin)
app.patch('/entregadores/:id/aprovar', authenticate, isAdmin, async (req, res) => {
  try {
    const entregadorId = req.params.id;
    const { aprovado } = req.body;

    if (typeof aprovado !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Campo "aprovado" deve ser true ou false'
      });
    }

    if (firebaseInitialized) {
      const entregadorRef = db.collection('entregadores').doc(entregadorId);
      await entregadorRef.update({
        status: aprovado ? 'aprovado' : 'rejeitado',
        verificado: aprovado,
        dataAprovacao: aprovado ? new Date().toISOString() : null
      });
    } else {
      const entregador = entregadores.find(e => e.id == entregadorId);
      if (entregador) {
        entregador.status = aprovado ? 'aprovado' : 'rejeitado';
        entregador.verificado = aprovado;
        entregador.dataAprovacao = aprovado ? new Date().toISOString() : null;
      }
    }

    res.json({
      success: true,
      message: `Entregador ${aprovado ? 'aprovado' : 'rejeitado'} com sucesso!`
    });

  } catch (error) {
    console.error('❌ Erro ao aprovar entregador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar entregador: ' + error.message
    });
  }
});

// ==================== ROTA RAIZ ====================

app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Entregadores 67 - Sistema Completo de Entregas',
    version: '2.0.0',
    database: firebaseInitialized ? 'Firebase' : 'Memória',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /register-user',
        createAdmin: 'POST /admin/create-admin'
      },
      entregadores: {
        cadastro: 'POST /cadastro (autenticado)',
        listar: 'GET /entregadores (admin)',
        aprovar: 'PATCH /entregadores/:id/aprovar (admin)'
      },
      pedidos: {
        listar: 'GET /pedidos (autenticado)',
        criar: 'POST /pedidos (admin)',
        aceitar: 'POST /pedidos/:id/aceitar (entregador)',
        status: 'PATCH /pedidos/:id/status (autenticado)'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ==================== ROTAS PARA INTEGRAÇÃO EXTERNA ====================

// Endpoint para receber pedidos do Garagem67
app.post('/api/external/orders', async (req, res) => {
  try {
    console.log('📥 Recebendo pedido externo do Garagem67...');
    console.log('📍 Origem da requisição:', req.headers.origin);
    console.log('📦 Dados recebidos:', req.body);
    
    const {
      external_id,
      store_name,
      store_phone, 
      customer,
      items,
      total,
      description,
      notes,
      metadata
    } = req.body;

    // Validar dados obrigatórios
    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({
        success: false,
        message: 'Dados do cliente incompletos (nome, telefone e endereço são obrigatórios)'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum item no pedido'
      });
    }

    // Gerar ID único se não fornecido
    const orderExternalId = external_id || `garagem67_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Criar pedido no formato do Entregadores67
    const novoPedido = {
      description: `🛍️ ${store_name}: ${description || items.map(item => `${item.quantity}x ${item.name}`).join(', ')}`,
      quantity: items.reduce((sum, item) => sum + item.quantity, 1),
      status: 'pendente',
      createdBy: 'external_garagem67',
      createdByName: store_name || 'Garagem 67',
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        complement: customer.complement || '',
        city: customer.city || 'Ivinhema',
        state: customer.state || 'MS'
      },
      external_id: orderExternalId,
      store_info: {
        name: store_name || 'Garagem 67 Bar e Conveniência',
        phone: store_phone || '67998668032'
      },
      items: items,
      total: parseFloat(total) || 0,
      notes: notes || '',
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Campos específicos para rastreamento
      source: 'garagem67',
      acceptedBy: null,
      acceptedByName: null,
      acceptedAt: null
    };

    let resultado;

    // Salvar no Firebase
    if (firebaseInitialized) {
      const docRef = await db.collection('pedidos').add(novoPedido);
      resultado = { id: docRef.id, ...novoPedido };
      console.log('✅ Pedido externo salvo no Firebase:', docRef.id);
    } else {
      // Fallback em memória
      novoPedido.id = `ext_${Date.now()}`;
      pedidos.push(novoPedido);
      resultado = novoPedido;
      console.log('✅ Pedido externo salvo em memória:', novoPedido.id);
    }

    console.log('🎉 Pedido externo processado com sucesso!');
    console.log('📦 ID Interno:', resultado.id);
    console.log('🆔 ID Externo:', orderExternalId);
    console.log('👤 Cliente:', customer.name);
    console.log('💰 Total:', total);

    res.status(201).json({
      success: true,
      message: 'Pedido recebido e criado com sucesso!',
      order: {
        internal_id: resultado.id,
        external_id: orderExternalId,
        status: 'pendente',
        created_at: novoPedido.createdAt
      },
      tracking_url: `https://entregador67.vercel.app/admin.html#gerenciar-pedidos`
    });

  } catch (error) {
    console.error('❌ Erro ao criar pedido externo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao processar pedido: ' + error.message
    });
  }
});

// Endpoint para verificar status do pedido
app.get('/api/external/orders/:external_id', async (req, res) => {
  try {
    const externalId = req.params.external_id;
    
    console.log('🔍 Buscando pedido externo:', externalId);

    let pedidoEncontrado = null;

    if (firebaseInitialized) {
      const snapshot = await db.collection('pedidos')
        .where('external_id', '==', externalId)
        .get();
      
      if (!snapshot.empty) {
        pedidoEncontrado = { 
          id: snapshot.docs[0].id, 
          ...snapshot.docs[0].data() 
        };
      }
    } else {
      pedidoEncontrado = pedidos.find(p => p.external_id === externalId);
    }

    if (!pedidoEncontrado) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    res.json({
      success: true,
      order: {
        internal_id: pedidoEncontrado.id,
        external_id: pedidoEncontrado.external_id,
        status: pedidoEncontrado.status,
        description: pedidoEncontrado.description,
        customer: pedidoEncontrado.customer,
        total: pedidoEncontrado.total,
        created_at: pedidoEncontrado.createdAt,
        accepted_by: pedidoEncontrado.acceptedByName,
        accepted_at: pedidoEncontrado.acceptedAt,
        updated_at: pedidoEncontrado.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pedido'
    });
  }
});

// Endpoint para listar pedidos externos (apenas admin)
app.get('/api/external/orders', authenticate, isAdmin, async (req, res) => {
  try {
    let pedidosExternos = [];

    if (firebaseInitialized) {
      const snapshot = await db.collection('pedidos')
        .where('source', '==', 'garagem67')
        .orderBy('createdAt', 'desc')
        .get();
      
      pedidosExternos = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    } else {
      pedidosExternos = pedidos.filter(p => p.source === 'garagem67')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({
      success: true,
      data: pedidosExternos,
      total: pedidosExternos.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar pedidos externos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pedidos externos'
    });
  }
});

// ==================== ROTA PARA UPLOAD DE JSON ====================

// Rota para upload de arquivos JSON
app.post('/api/upload-json', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('📥 Recebendo upload de arquivo JSON...');
    
    const { fileName, fileContent } = req.body;

    if (!fileName || !fileContent) {
      return res.status(400).json({
        success: false,
        message: 'Nome do arquivo e conteúdo são obrigatórios'
      });
    }

    console.log('📂 Processando arquivo:', fileName);

    let orderData;
    try {
      orderData = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo JSON inválido: ' + parseError.message
      });
    }

    // Validar estrutura básica do JSON
    if (!orderData.customer || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Estrutura do JSON inválida. Campos customer e items são obrigatórios.'
      });
    }

    // Processar como pedido externo
    const externalOrderData = {
      external_id: orderData.order_id || `upload_${Date.now()}`,
      store_name: "Garagem 67 Bar e Conveniência",
      store_phone: "67998668032",
      customer: {
        name: orderData.customer.name,
        phone: orderData.customer.phone,
        address: `${orderData.customer.address.street}, ${orderData.customer.address.city} - ${orderData.customer.address.state}`,
        complement: orderData.customer.address.complement || '',
        city: orderData.customer.address.city,
        state: orderData.customer.address.state
      },
      items: orderData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.subtotal
      })),
      total: orderData.totals.total,
      description: orderData.items.map(item => `${item.quantity}x ${item.name}`).join(', '),
      notes: orderData.notes || 'Pedido via upload JSON',
      metadata: {
        source: 'json_upload',
        original_file: fileName,
        upload_time: new Date().toISOString()
      }
    };

    console.log('🔄 Processando pedido do JSON:', externalOrderData.customer.name);

    // Salvar no Firebase
    const novoPedido = {
      description: `🛍️ Garagem 67: ${externalOrderData.description}`,
      quantity: externalOrderData.items.reduce((sum, item) => sum + item.quantity, 1),
      status: 'pendente',
      createdBy: req.user.uid,
      createdByName: req.user.name || 'Administrador',
      customer: externalOrderData.customer,
      external_id: externalOrderData.external_id,
      store_info: externalOrderData.store_info,
      items: externalOrderData.items,
      total: externalOrderData.total,
      notes: externalOrderData.notes,
      metadata: externalOrderData.metadata,
      source: 'json_upload',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      acceptedBy: null,
      acceptedByName: null,
      acceptedAt: null
    };

    let resultado;

    if (firebaseInitialized) {
      const docRef = await db.collection('pedidos').add(novoPedido);
      resultado = { id: docRef.id, ...novoPedido };
      console.log('✅ Pedido do JSON salvo no Firebase:', docRef.id);
    } else {
      novoPedido.id = `json_${Date.now()}`;
      pedidos.push(novoPedido);
      resultado = novoPedido;
      console.log('✅ Pedido do JSON salvo em memória:', novoPedido.id);
    }

    res.json({
      success: true,
      message: 'Arquivo JSON processado com sucesso! Pedido criado.',
      order: {
        internal_id: resultado.id,
        external_id: externalOrderData.external_id,
        customer: externalOrderData.customer.name,
        total: externalOrderData.total,
        status: 'pendente'
      },
      stats: {
        items: externalOrderData.items.length,
        total: externalOrderData.total
      }
    });

  } catch (error) {
    console.error('❌ Erro ao processar arquivo JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar arquivo JSON: ' + error.message
    });
  }
});

// Rota para listar pedidos de upload JSON
app.get('/api/json-orders', authenticate, isAdmin, async (req, res) => {
  try {
    let pedidosJson = [];

    if (firebaseInitialized) {
      const snapshot = await db.collection('pedidos')
        .where('source', '==', 'json_upload')
        .orderBy('createdAt', 'desc')
        .get();
      
      pedidosJson = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    } else {
      pedidosJson = pedidos.filter(p => p.source === 'json_upload')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({
      success: true,
      data: pedidosJson,
      total: pedidosJson.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar pedidos JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pedidos JSON'
    });
  }
});

// ==================== INICIALIZAÇÃO ====================

app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 ENTREGADORES 67 - SISTEMA COMPLETO v2.0');
  console.log('='.repeat(70));
  console.log(`📍 Servidor rodando: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Register user: POST http://localhost:${PORT}/register-user`);
  console.log(`👑 Create admin: POST http://localhost:${PORT}/admin/create-admin`);
  console.log('='.repeat(70));
  console.log(`⚡ Banco de dados: ${firebaseInitialized ? 'Firebase (Produção)' : 'Memória (Desenvolvimento)'}`);
  console.log('='.repeat(70));
  
  // Criar dados de exemplo apenas se não estiver usando Firebase
  if (!firebaseInitialized) {
    criarDadosExemplo();
  }
});

function criarDadosExemplo() {
  // Criar admin de exemplo
  const adminId = 'admin-exemplo';
  users.push({
    id: adminId,
    email: 'admin@entregadores67.com',
    name: 'Administrador',
    role: 'admin',
    profileCompleted: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  });

  // Criar entregador de exemplo
  entregadores.push({
    id: nextEntregadorId++,
    userId: 'entregador-exemplo',
    userEmail: 'entregador@exemplo.com',
    nome: 'João Silva',
    cpf: '12345678901',
    telefone: '67999999999',
    veiculo: 'moto',
    endereco: 'Rua Exemplo, 123',
    cidade: 'Ivinhema',
    estado: 'MS',
    cep: '79740000',
    disponibilidade: 'flexivel',
    possuiCnh: true,
    cnh: '123456789',
    status: 'aprovado',
    verificado: true,
    ativo: true,
    dataCadastro: new Date().toISOString()
  });

  // Criar pedidos de exemplo
  pedidos.push({
    id: nextPedidoId++,
    description: '2x Pizza Calabresa + 1x Coca-Cola 2L',
    quantity: 1,
    status: 'pendente',
    createdBy: adminId,
    createdByName: 'Administrador',
    acceptedBy: null,
    acceptedByName: null,
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    updatedAt: new Date().toISOString()
  });

  pedidos.push({
    id: nextPedidoId++,
    description: 'Entrega de documentos - Cartório para Prefeitura',
    quantity: 1,
    status: 'aceito',
    createdBy: adminId,
    createdByName: 'Administrador',
    acceptedBy: 'entregador-exemplo',
    acceptedByName: 'João Silva',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    acceptedAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log('📋 Dados de exemplo criados para demonstração');
}

// ========== ROTAS ADMIN ==========

// Rota para criar admin (executar pelo console)
app.post('/admin/create-admin', async (req, res) => {
    try {
        console.log('👑 Recebendo requisição para criar admin...');
        
        const { uid, email, name } = req.body;

        if (!uid || !email) {
            return res.status(400).json({
                success: false,
                message: 'UID e email são obrigatórios'
            });
        }

        const adminData = {
            email: email,
            name: name || 'Administrador',
            role: 'admin',
            profileCompleted: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        console.log('👑 Criando admin para:', email);

        let result;

        if (firebaseInitialized) {
            const userRef = db.collection('users').doc(uid);
            await userRef.set(adminData, { merge: true });
            result = { id: uid, ...adminData };
            console.log('✅ Admin criado no Firebase');
        } else {
            const existingUser = users.find(u => u.id === uid);
            if (existingUser) {
                Object.assign(existingUser, adminData);
                result = existingUser;
            } else {
                const newUser = { id: uid, ...adminData };
                users.push(newUser);
                result = newUser;
            }
            console.log('✅ Admin criado em memória');
        }

        res.json({
            success: true,
            message: '✅ Admin criado com sucesso!',
            user: result
        });

    } catch (error) {
        console.error('❌ Erro ao criar admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor: ' + error.message
        });
    }
});

// Rota para promover usuário a admin (para admins existentes)
app.post('/admin/promote-user', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email é obrigatório'
            });
        }

        console.log('👑 Promovendo usuário para admin:', email);

        let userUpdated = false;

        if (firebaseInitialized) {
            // Buscar usuário pelo email
            const usersSnapshot = await db.collection('users')
                .where('email', '==', email)
                .get();

            if (!usersSnapshot.empty) {
                const userDoc = usersSnapshot.docs[0];
                await userDoc.ref.update({
                    role: 'admin',
                    updatedAt: new Date().toISOString()
                });
                userUpdated = true;
                console.log('✅ Usuário promovido no Firebase');
            }
        } else {
            const user = users.find(u => u.email === email);
            if (user) {
                user.role = 'admin';
                userUpdated = true;
                console.log('✅ Usuário promovido em memória');
            }
        }

        if (userUpdated) {
            res.json({
                success: true,
                message: '✅ Usuário promovido a administrador com sucesso!',
                user: { email, role: 'admin' }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

    } catch (error) {
        console.error('❌ Erro ao promover usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});