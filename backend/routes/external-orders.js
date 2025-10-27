// routes/external-orders.js - Adicionar ao seu backend
app.post('/api/external/orders', async (req, res) => {
  try {
    console.log('📥 Recebendo pedido externo:', req.body);
    
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
        message: 'Dados do cliente incompletos'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum item no pedido'
      });
    }

    // Criar pedido no formato do Entregadores67
    const novoPedido = {
      description: `🛍️ ${store_name}: ${description || 'Pedido externo'}`,
      quantity: items.reduce((sum, item) => sum + item.quantity, 1),
      status: 'pendente',
      createdBy: 'external_system', // Ou ID de admin específico
      createdByName: store_name,
      customer: customer, // Novo campo para dados do cliente
      external_id: external_id,
      store_phone: store_phone,
      total: total,
      items: items,
      notes: notes,
      metadata: metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let resultado;

    // Salvar no Firebase
    if (firebaseInitialized) {
      const docRef = await db.collection('pedidos').add(novoPedido);
      resultado = { id: docRef.id, ...novoPedido };
    } else {
      // Fallback em memória
      novoPedido.id = `ext_${Date.now()}`;
      pedidos.push(novoPedido);
      resultado = novoPedido;
    }

    console.log('✅ Pedido externo criado:', resultado.id);

    res.status(201).json({
      success: true,
      message: 'Pedido recebido e criado com sucesso!',
      order: resultado,
      internal_id: resultado.id
    });

  } catch (error) {
    console.error('❌ Erro ao criar pedido externo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao processar pedido'
    });
  }
});

// Rota para verificar status do pedido
app.get('/api/external/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    
    let pedido;
    
    if (firebaseInitialized) {
      const doc = await db.collection('pedidos').doc(orderId).get();
      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }
      pedido = { id: doc.id, ...doc.data() };
    } else {
      pedido = pedidos.find(p => p.id === orderId);
      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }
    }

    res.json({
      success: true,
      order: {
        id: pedido.id,
        status: pedido.status,
        description: pedido.description,
        acceptedBy: pedido.acceptedBy,
        acceptedByName: pedido.acceptedByName,
        acceptedAt: pedido.acceptedAt,
        updatedAt: pedido.updatedAt
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