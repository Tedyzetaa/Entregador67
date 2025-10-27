// admin.js - URL CORRIGIDA para Railway
const BACKEND_URL = 'https://entregador67-production.up.railway.app';

let currentUser = null;
let userToken = null;

// Elementos DOM
const formCriarPedido = document.getElementById('form-criar-pedido');
const listaPedidosAdmin = document.getElementById('lista-pedidos-admin');
const listaEntregadores = document.getElementById('lista-entregadores');

// Inicializar admin
document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
});

// Inicializar área admin
async function initAdmin() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            userToken = await user.getIdToken();
            
            // Verificar se é admin
            if (await verificarAdmin()) {
                showUserInfo(user);
                await carregarPedidosAdmin();
                await carregarEntregadores();
                iniciarAutoAtualizacao();
            } else {
                alert('❌ Acesso negado. Apenas administradores podem acessar esta página.');
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'index.html';
        }
    });

    // Event Listeners
    if (formCriarPedido) {
        formCriarPedido.addEventListener('submit', criarPedido);
    }
}

// Verificar se usuário é admin
async function verificarAdmin() {
    try {
        const response = await fetch(`${BACKEND_URL}/entregadores`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('❌ Erro ao verificar admin:', error);
        return false;
    }
}

// Mostrar informações do usuário
function showUserInfo(user) {
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    if (userName) userName.textContent = user.displayName || user.email;
    if (userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/40';
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut();
            window.location.href = 'index.html';
        });
    }
}

// Criar pedido
async function criarPedido(e) {
    e.preventDefault();
    
    const formData = new FormData(formCriarPedido);
    const dados = {
        description: formData.get('descricao'),
        quantity: parseInt(formData.get('quantidade'))
    };

    try {
        const btn = document.getElementById('btn-criar-pedido');
        btn.classList.add('loading');
        btn.disabled = true;
        btn.textContent = 'CRIANDO...';

        const response = await fetch(`${BACKEND_URL}/pedidos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Pedido criado com sucesso!');
            formCriarPedido.reset();
            await carregarPedidosAdmin();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        alert('❌ Erro ao criar pedido: ' + error.message);
    } finally {
        const btn = document.getElementById('btn-criar-pedido');
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.textContent = '📦 CRIAR PEDIDO';
    }
}

// Carregar pedidos para admin
async function carregarPedidosAdmin() {
    try {
        const response = await fetch(`${BACKEND_URL}/pedidos`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            exibirPedidosAdmin(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar pedidos:', error);
        if (listaPedidosAdmin) {
            listaPedidosAdmin.innerHTML = '<div class="erro-carregamento">❌ Erro ao carregar pedidos.</div>';
        }
    }
}

// Exibir pedidos para admin
function exibirPedidosAdmin(pedidos) {
    if (!listaPedidosAdmin) return;
    
    if (pedidos.length === 0) {
        listaPedidosAdmin.innerHTML = '<div class="sem-dados">📝 Nenhum pedido encontrado.</div>';
        return;
    }

    listaPedidosAdmin.innerHTML = pedidos.map(pedido => `
        <div class="pedido-card admin ${pedido.status}" data-pedido-id="${pedido.id}">
            <div class="pedido-header">
                <h3>Pedido #${pedido.id}</h3>
                <span class="pedido-status ${pedido.status}">${pedido.status.toUpperCase()}</span>
            </div>
            <div class="pedido-content">
                <p><strong>📦 Descrição:</strong> ${pedido.description}</p>
                <p><strong>🔢 Quantidade:</strong> ${pedido.quantity}</p>
                <p><strong>🕐 Criado em:</strong> ${formatarData(pedido.createdAt)}</p>
                ${pedido.acceptedBy ? `<p><strong>✅ Aceito por:</strong> ${pedido.acceptedByName || pedido.acceptedBy}</p>` : ''}
                ${pedido.acceptedAt ? `<p><strong>⏱️ Aceito em:</strong> ${formatarData(pedido.acceptedAt)}</p>` : ''}
            </div>
            <div class="pedido-actions admin">
                ${pedido.status === 'pendente' ? `
                    <button class="btn-danger" onclick="excluirPedido('${pedido.id}')">
                        🗑️ Excluir
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Carregar entregadores
async function carregarEntregadores() {
    try {
        const response = await fetch(`${BACKEND_URL}/entregadores`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            exibirEntregadores(result.data);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar entregadores:', error);
    }
}

// Exibir entregadores
function exibirEntregadores(entregadores) {
    if (!listaEntregadores) return;
    
    if (!entregadores || entregadores.length === 0) {
        listaEntregadores.innerHTML = '<div class="sem-dados">👤 Nenhum entregador cadastrado.</div>';
        return;
    }

    listaEntregadores.innerHTML = entregadores.map(entregador => `
        <div class="entregador-card">
            <div class="entregador-header">
                <h3>${entregador.nome}</h3>
                <span class="entregador-status ${entregador.status || 'ativo'}">${(entregador.status || 'ativo').toUpperCase()}</span>
            </div>
            <div class="entregador-content">
                <p><strong>📞 Telefone:</strong> ${entregador.telefone}</p>
                <p><strong>🚗 Veículo:</strong> ${entregador.veiculo}</p>
                <p><strong>📍 Cidade:</strong> ${entregador.cidade}</p>
                <p><strong>🕐 Disponibilidade:</strong> ${entregador.disponibilidade}</p>
                <p><strong>📅 Cadastrado em:</strong> ${formatarData(entregador.dataCadastro)}</p>
            </div>
            <div class="entregador-actions">
                <button class="btn-secondary" onclick="verDetalhesEntregador('${entregador.id}')">
                    👁️ Detalhes
                </button>
            </div>
        </div>
    `).join('');
}

// Funções administrativas
async function excluirPedido(pedidoId) {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/pedidos/${pedidoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        if (response.ok) {
            alert('✅ Pedido excluído com sucesso!');
            await carregarPedidosAdmin();
        }
    } catch (error) {
        console.error('❌ Erro ao excluir pedido:', error);
        alert('❌ Erro ao excluir pedido.');
    }
}

// Formatar data
function formatarData(dataString) {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
}

// Auto-atualização
function iniciarAutoAtualizacao() {
    setInterval(async () => {
        await carregarPedidosAdmin();
        await carregarEntregadores();
    }, 30000);
}

// Função para criar admin (executar no console)
window.createAdmin = function() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Faça login primeiro!');
        return;
    }
    
    // USANDO A URL CORRETA DO RAILWAY
    fetch(`${BACKEND_URL}/admin/create-admin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: user.displayName || 'Administrador'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Admin criado:', data);
        alert('Admin criado com sucesso! Recarregue a página.');
        location.reload();
    })
    .catch(error => {
        console.error('❌ Erro ao criar admin:', error);
        alert('Erro ao criar admin: ' + error.message);
    });
};

// Funções auxiliares (placeholder)
function verDetalhesEntregador(entregadorId) {
    alert(`Detalhes do entregador ${entregadorId} - Em desenvolvimento`);
}