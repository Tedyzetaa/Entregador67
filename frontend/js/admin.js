// admin.js - Lógica do painel administrativo
// NOVA URL - use esta:
const BACKEND_URL = 'https://entregador67-production.up.railway.app';

let currentUser = null;
let userToken = null;

// Elementos DOM
const formCriarPedido = document.getElementById('form-criar-pedido');
const btnCriarPedido = document.getElementById('btn-criar-pedido');
const listaPedidosAdmin = document.getElementById('lista-pedidos-admin');
const listaEntregadores = document.getElementById('lista-entregadores');
const botoesFiltro = document.querySelectorAll('.btn-filter');

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
});

// Inicializar painel admin
async function initAdmin() {
    // Verificar autenticação e role
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            userToken = await user.getIdToken();
            
            // Verificar se é admin
            await verificarPermissaoAdmin();
            showUserInfo(user);
            await carregarDadosAdmin();
            iniciarAutoAtualizacao();
        } else {
            window.location.href = 'index.html';
        }
    });

    // Event Listeners
    formCriarPedido.addEventListener('submit', criarPedido);
    
    // Filtros
    botoesFiltro.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesFiltro.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtrarPedidos(btn.dataset.status);
        });
    });
}

// Verificar se usuário é admin
async function verificarPermissaoAdmin() {
    try {
        const response = await fetch(`${BACKEND_URL}/pedidos`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Acesso negado');
        }
    } catch (error) {
        alert('❌ Acesso negado. Você não tem permissão de administrador.');
        window.location.href = 'index.html';
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

// Carregar todos os dados do admin
async function carregarDadosAdmin() {
    await carregarPedidosAdmin();
    await carregarEntregadores();
}

// Criar novo pedido
async function criarPedido(e) {
    e.preventDefault();

    const formData = new FormData(formCriarPedido);
    const dados = {
        description: formData.get('descricao'),
        quantity: parseInt(formData.get('quantidade'))
    };

    try {
        btnCriarPedido.classList.add('loading');
        btnCriarPedido.disabled = true;
        btnCriarPedido.textContent = 'CRIANDO...';

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
        btnCriarPedido.classList.remove('loading');
        btnCriarPedido.disabled = false;
        btnCriarPedido.textContent = '📦 CRIAR PEDIDO';
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
        listaPedidosAdmin.innerHTML = '<div class="erro-carregamento">❌ Erro ao carregar pedidos.</div>';
    }
}

// Exibir pedidos no admin
function exibirPedidosAdmin(pedidos) {
    if (pedidos.length === 0) {
        listaPedidosAdmin.innerHTML = '<div class="sem-dados">📝 Nenhum pedido cadastrado.</div>';
        return;
    }

    // Ordenar por data de criação (mais recentes primeiro)
    pedidos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    listaPedidosAdmin.innerHTML = pedidos.map(pedido => `
        <div class="pedido-card ${pedido.status}" data-pedido-id="${pedido.id}" data-status="${pedido.status}">
            <div class="pedido-header">
                <h3>Pedido #${pedido.id}</h3>
                <span class="pedido-status ${pedido.status}">${pedido.status.toUpperCase()}</span>
            </div>
            <div class="pedido-content">
                <p><strong>📦 Descrição:</strong> ${pedido.description}</p>
                <p><strong>🔢 Quantidade:</strong> ${pedido.quantity}</p>
                <p><strong>👤 Criado por:</strong> ${pedido.createdByName || 'Admin'}</p>
                <p><strong>✅ Aceito por:</strong> ${pedido.acceptedByName || 'Ninguém'}</p>
                <p><strong>🕐 Criado em:</strong> ${formatarData(pedido.createdAt)}</p>
                ${pedido.acceptedAt ? `<p><strong>✅ Aceito em:</strong> ${formatarData(pedido.acceptedAt)}</p>` : ''}
            </div>
            <div class="pedido-stats">
                <div class="stat">
                    <span class="stat-label">Status</span>
                    <span class="stat-value ${pedido.status}">${pedido.status}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Entregador</span>
                    <span class="stat-value">${pedido.acceptedByName || 'Aguardando'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtrar pedidos
function filtrarPedidos(status) {
    const cards = listaPedidosAdmin.querySelectorAll('.pedido-card');
    
    cards.forEach(card => {
        if (status === 'todos' || card.dataset.status === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
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
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar entregadores:', error);
        listaEntregadores.innerHTML = '<div class="erro-carregamento">❌ Erro ao carregar entregadores.</div>';
    }
}

// Exibir entregadores
function exibirEntregadores(entregadores) {
    if (entregadores.length === 0) {
        listaEntregadores.innerHTML = '<div class="sem-dados">📝 Nenhum entregador cadastrado.</div>';
        return;
    }

    listaEntregadores.innerHTML = entregadores.map(entregador => `
        <div class="entregador-card ${entregador.status}">
            <div class="entregador-header">
                <h3>${entregador.nome}</h3>
                <span class="entregador-status ${entregador.status}">${entregador.status.toUpperCase()}</span>
            </div>
            <div class="entregador-info">
                <p><strong>📧 Email:</strong> ${entregador.userEmail}</p>
                <p><strong>📞 Telefone:</strong> ${formatarTelefone(entregador.telefone)}</p>
                <p><strong>🚗 Veículo:</strong> ${entregador.veiculo}</p>
                <p><strong>📍 Cidade:</strong> ${entregador.cidade}</p>
                <p><strong>🕐 Cadastrado em:</strong> ${formatarData(entregador.dataCadastro)}</p>
            </div>
            <div class="entregador-actions">
                ${entregador.status === 'pendente' ? `
                    <button class="btn-success" onclick="aprovarEntregador('${entregador.id}', true)">
                        ✅ Aprovar
                    </button>
                    <button class="btn-danger" onclick="aprovarEntregador('${entregador.id}', false)">
                        ❌ Rejeitar
                    </button>
                ` : ''}
                ${entregador.status === 'aprovado' ? `
                    <span class="status-aprovado">✅ Aprovado</span>
                ` : ''}
                ${entregador.status === 'rejeitado' ? `
                    <span class="status-rejeitado">❌ Rejeitado</span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Aprovar/rejeitar entregador
async function aprovarEntregador(entregadorId, aprovado) {
    if (!confirm(`Tem certeza que deseja ${aprovado ? 'aprovar' : 'rejeitar'} este entregador?`)) {
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/entregadores/${entregadorId}/aprovar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ aprovado })
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ Entregador ${aprovado ? 'aprovado' : 'rejeitado'} com sucesso!`);
            await carregarEntregadores();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar entregador:', error);
        alert('❌ Erro ao atualizar entregador: ' + error.message);
    }
}

// Formatar telefone
function formatarTelefone(telefone) {
    if (!telefone) return 'N/A';
    const tel = telefone.toString();
    if (tel.length === 11) {
        return `(${tel.substring(0, 2)}) ${tel.substring(2, 7)}-${tel.substring(7)}`;
    }
    return telefone;
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