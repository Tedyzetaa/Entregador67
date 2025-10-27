const admin = require('firebase-admin');

// Inicializar Firebase
const serviceAccount = require('./firebase-config.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando estrutura do banco de dados...');

    // Criar documento de saúde para testar conexão
    await db.collection('health').doc('check').set({
      status: 'active',
      initialized: new Date().toISOString(),
      message: 'Banco de dados Entregadores67 inicializado com sucesso!'
    });

    // Criar alguns entregadores de exemplo
    const entregadorExemplo = {
      nome: "João Silva",
      cpf: "12345678901",
      telefone: "67999999999",
      veiculo: "moto",
      endereco: "Rua Exemplo, 123",
      cidade: "Ivinhema",
      estado: "MS",
      cep: "79740000",
      disponibilidade: "flexivel",
      dataCadastro: new Date().toISOString(),
      status: "aprovado",
      verificado: true,
      ativo: true
    };

    // Criar alguns pedidos de exemplo
    const pedidoExemplo = {
      clienteNome: "Maria Santos",
      clienteTelefone: "67988888888",
      enderecoColeta: "Restaurante Sabor Caseiro - Av. Principal, 456",
      enderecoEntrega: "Rua das Flores, 789 - Centro",
      itens: ["2x Pizza Calabresa", "1x Coca-Cola 2L"],
      valor: 45.50,
      observacoes: "Entregar sem campainha, apenas WhatsApp",
      urgente: false,
      status: "pendente",
      entregadorId: null,
      entregadorNome: null,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    // Adicionar dados de exemplo
    await db.collection('entregadores').add(entregadorExemplo);
    await db.collection('pedidos').add(pedidoExemplo);

    console.log('✅ Estrutura do banco criada com sucesso!');
    console.log('📊 Coleções criadas:');
    console.log('   - entregadores');
    console.log('   - pedidos'); 
    console.log('   - health');
    console.log('🎯 Agora você pode usar o sistema com banco de dados real!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
}

initializeDatabase();