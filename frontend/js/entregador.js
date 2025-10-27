// entregador.js - Lógica da área do entregador
const BACKEND_URL = 'http://localhost:3000';

let currentUser = null;
let userToken = null;
let pedidoParaAceitar = null;

// Elementos DOM
const listaPedidos = document.getElementById('lista-pedidos');
const listaMeusPedidos = document.getElementById('lista-meus-pedidos');
const totalPedidos = document.getElementById('total-pedidos');
const btnAtualizar = document.getElementById('btn-atualizar');
const confirmacaoModal = document.getElementById('confirmacao-modal');
const confirmacaoTexto = document.getElementById('confirmacao-texto');
const btnConfirmarAceitar = document.getElementById('btn-confirmar-aceitar');
const btnCancelarAceitar = document.getElementById('btn-cancelar-aceitar');
const semPedidos = document.getElementById('sem-pedidos');
const semMeusPedidos = document.getElementById('sem-meus-pedidos');

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    initEntregador();
});

// Inicializar área do entregador
async function initEntregador() {
    // Verificar autenticação
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            userToken = await user.getIdToken();
            showUserInfo(user);
            await carregarPedidos();
            await carregarMeusPedidos();
            iniciarAutoAtualizacao();
        } else {
            // Redirecionar para login se não estiver autenticado
            window.location.href = 'index.html';
        }
    });

    // Event Listeners
    btnAtualizar.addEventListener('click', carregarPedidos);
    
    // Modal de confirmação
    btnConfirmarAceitar.addEventListener('click', aceitarPedidoConfirmado);
    btnCancelarAceitar.addEventListener('click', () => {
        confirmacaoModal.style.display = 'none';
        pedidoParaAceitar = null;
    });

    // Fechar modal
    document.querySelector('#confirmacao-modal .close').addEventListener('click', () => {
        confirmacaoModal.style.display = 'none';
        pedidoParaAceitar = null;
    });
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

// Carregar pedidos disponíveis
async function carregarPedidos() {
    try {
        btnAtualizar.classList.add('loading');
        btnAtualizar.disabled = true;

        const response = await fetch(`${BACKEND_URL}/pedidos?status=pendente`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const pedidosPendentes = result.data.filter(pedido => pedido.status === 'pendente');
            exibirPedidos(pedidosPendentes);
            totalPedidos.textContent = `${pedidosPendentes.length} pedido(s) disponível(eis)`;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar pedidos:', error);
        listaPedidos.innerHTML = '<div class="erro-carregamento">❌ Erro ao carregar pedidos. Tente novamente.</div>';
    } finally {
        btnAtualizar.classList.remove('loading');
        btnAtualizar.disabled = false;
    }
}

// Carregar pedidos aceitos pelo usuário
async function carregarMeusPedidos() {
    try {
        const response = await fetch(`${BACKEND_URL}/pedidos`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const meusPedidos = result.data.filter(pedido => 
                pedido.acceptedBy === currentUser.uid && pedido.status !== 'pendente'
            );
            exibirMeusPedidos(meusPedidos);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar meus pedidos:', error);
    }
}

// Exibir pedidos disponíveis
function exibirPedidos(pedidos) {
    if (pedidos.length === 0) {
        listaPedidos.style.display = 'none';
        semPedidos.style.display = 'block';
        return;
    }

    listaPedidos.style.display = 'block';
    semPedidos.style.display = 'none';

    listaPedidos.innerHTML = pedidos.map(pedido => `
        <div class="pedido-card" data-pedido-id="${pedido.id}">
            <div class="pedido-header">
                <h3>Pedido #${pedido.id}</h3>
                <span class="pedido-status pendente">PENDENTE</span>
            </div>
            <div class="pedido-content">
                <p><strong>📦 Conteúdo:</strong> ${pedido.description}</p>
                <p><strong>🔢 Quantidade:</strong> ${pedido.quantity}</p>
                <p><strong>🕐 Criado em:</strong> ${formatarData(pedido.createdAt)}</p>
            </div>
            <div class="pedido-actions">
                <button class="btn-primary btn-aceitar" onclick="solicitarAceitarPedido('${pedido.id}', '${pedido.description}')">
                    ✅ Aceitar Pedido
                </button>
            </div>
        </div>
    `).join('');
}

// Exibir meus pedidos
function exibirMeusPedidos(pedidos) {
    if (pedidos.length === 0) {
        listaMeusPedidos.style.display = 'none';
        semMeusPedidos.style.display = 'block';
        return;
    }

    listaMeusPedidos.style.display = 'block';
    semMeusPedidos.style.display = 'none';

    listaMeusPedidos.innerHTML = pedidos.map(pedido => `
        <div class="pedido-card ${pedido.status}" data-pedido-id="${pedido.id}">
            <div class="pedido-header">
                <h3>Pedido #${pedido.id}</h3>
                <span class="pedido-status ${pedido.status}">${pedido.status.toUpperCase()}</span>
            </div>
            <div class="pedido-content">
                <p><strong>📦 Conteúdo:</strong> ${pedido.description}</p>
                <p><strong>🔢 Quantidade:</strong> ${pedido.quantity}</p>
                <p><strong>✅ Aceito em:</strong> ${formatarData(pedido.acceptedAt)}</p>
                <p><strong>🔄 Última atualização:</strong> ${formatarData(pedido.updatedAt)}</p>
            </div>
            <div class="pedido-actions">
                ${pedido.status === 'aceito' ? `
                    <button class="btn-secondary" onclick="atualizarStatusPedido('${pedido.id}', 'em_rota')">
                        🚚 Iniciar Entrega
                    </button>
                    <button class="btn-success" onclick="atualizarStatusPedido('${pedido.id}', 'entregue')">
                        ✅ Marcar como Entregue
                    </button>
                ` : ''}
                ${pedido.status === 'em_rota' ? `
                    <button class="btn-success" onclick="atualizarStatusPedido('${pedido.id}', 'entregue')">
                        ✅ Marcar como Entregue
                    </button>
                ` : ''}
                ${pedido.status === 'entregue' ? `
                    <span class="pedido-entregue">🎉 Pedido Entregue!</span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Solicitar aceitação de pedido
function solicitarAceitarPedido(pedidoId, descricao) {
    pedidoParaAceitar = pedidoId;
    confirmacaoTexto.textContent = `Tem certeza que deseja aceitar o pedido "${descricao}"?`;
    confirmacaoModal.style.display = 'flex';
}

// Aceitar pedido confirmado
async function aceitarPedidoConfirmado() {
    if (!pedidoParaAceitar) return;

    try {
        btnConfirmarAceitar.classList.add('loading');
        btnConfirmarAceitar.disabled = true;
        btnConfirmarAceitar.textContent = 'ACEITANDO...';

        const response = await fetch(`${BACKEND_URL}/pedidos/${pedidoParaAceitar}/aceitar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Pedido aceito com sucesso!');
            confirmacaoModal.style.display = 'none';
            await carregarPedidos();
            await carregarMeusPedidos();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao aceitar pedido:', error);
        alert('❌ Erro ao aceitar pedido: ' + error.message);
    } finally {
        btnConfirmarAceitar.classList.remove('loading');
        btnConfirmarAceitar.disabled = false;
        btnConfirmarAceitar.textContent = 'Sim, Aceitar Pedido';
        pedidoParaAceitar = null;
    }
}

// Atualizar status do pedido
async function atualizarStatusPedido(pedidoId, novoStatus) {
    try {
        const response = await fetch(`${BACKEND_URL}/pedidos/${pedidoId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ status: novoStatus })
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ Status do pedido atualizado para: ${novoStatus}`);
            await carregarMeusPedidos();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        alert('❌ Erro ao atualizar status: ' + error.message);
    }
}

// Formatar data
function formatarData(dataString) {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
}

// Auto-atualização a cada 30 segundos
function iniciarAutoAtualizacao() {
    setInterval(async () => {
        await carregarPedidos();
        await carregarMeusPedidos();
    }, 30000);
}

// Verificar conexão com backend
async function verificarConexaoBackend() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.json();
        return data.status === 'OK';
    } catch (error) {
        console.warn('⚠️ Backend offline');
        return false;
    }
}