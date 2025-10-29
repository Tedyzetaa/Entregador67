// admin.js - Sistema completo do painel administrativo
const BACKEND_URL = 'https://entregador67-production.up.railway.app';

let currentUser = null;
let userToken = null;
let allPedidos = [];
let filteredPedidos = [];

// Elementos DOM
const formCriarPedido = document.getElementById('form-criar-pedido');
const listaPedidosAdmin = document.getElementById('lista-pedidos-admin');
const listaEntregadores = document.getElementById('lista-entregadores');
const pedidosFiltros = document.querySelector('.pedidos-filtros');

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
                setupEventListeners();
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
}

// Configurar event listeners
function setupEventListeners() {
    // Formulário criar pedido
    if (formCriarPedido) {
        formCriarPedido.addEventListener('submit', criarPedido);
    }

    // Filtros de pedidos
    if (pedidosFiltros) {
        pedidosFiltros.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-filter')) {
                // Remover classe active de todos os botões
                document.querySelectorAll('.btn-filter').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Adicionar classe active ao botão clicado
                e.target.classList.add('active');
                
                // Aplicar filtro
                const status = e.target.getAttribute('data-status');
                filtrarPedidos(status);
            }
        });
    }

    // Navegação suave
    setupSmoothNavigation();
}

// Configurar navegação suave
function setupSmoothNavigation() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
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

    // Validação
    if (!dados.description || dados.description.trim().length < 5) {
        showNotification('❌ A descrição deve ter pelo menos 5 caracteres', 'error');
        return;
    }

    if (!dados.quantity || dados.quantity < 1) {
        showNotification('❌ A quantidade deve ser pelo menos 1', 'error');
        return;
    }

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
            showNotification('✅ Pedido criado com sucesso!', 'success');
            formCriarPedido.reset();
            await carregarPedidosAdmin();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        showNotification('❌ Erro ao criar pedido: ' + error.message, 'error');
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
        showLoadingState('lista-pedidos-admin', '🔄 Carregando pedidos...');

        const response = await fetch(`${BACKEND_URL}/pedidos`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            allPedidos = result.data;
            aplicarFiltroAtual();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar pedidos:', error);
        showErrorState('lista-pedidos-admin', '❌ Erro ao carregar pedidos. Tente novamente.');
    }
}

// Aplicar filtro atual
function aplicarFiltroAtual() {
    const activeFilter = document.querySelector('.btn-filter.active');
    const status = activeFilter ? activeFilter.getAttribute('data-status') : 'todos';
    filtrarPedidos(status);
}

// Filtrar pedidos
function filtrarPedidos(status) {
    if (status === 'todos') {
        filteredPedidos = allPedidos;
    } else if (status === 'json_upload') {
        filteredPedidos = allPedidos.filter(pedido => 
            pedido.source === 'json_upload' || pedido.source === 'garagem67'
        );
    } else {
        filteredPedidos = allPedidos.filter(pedido => pedido.status === status);
    }
    
    exibirPedidosAdmin(filteredPedidos);
}

// Exibir pedidos para admin
function exibirPedidosAdmin(pedidos) {
    if (!listaPedidosAdmin) return;
    
    if (pedidos.length === 0) {
        listaPedidosAdmin.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>Nenhum pedido encontrado</h3>
                <p>${getEmptyStateMessage()}</p>
            </div>
        `;
        return;
    }

    // Ordenar por data de criação (mais recente primeiro)
    pedidos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    listaPedidosAdmin.innerHTML = pedidos.map(pedido => `
        <div class="pedido-card admin ${pedido.status} ${pedido.source ? pedido.source : ''}" data-pedido-id="${pedido.id}">
            <div class="pedido-header">
                <div class="pedido-title">
                    <h3>Pedido #${pedido.id.substring(0, 8)}</h3>
                    ${pedido.external_id ? `
                        <span class="pedido-external-id">🔗 ${pedido.external_id.substring(0, 12)}...</span>
                    ` : ''}
                </div>
                <div class="pedido-badges">
                    <span class="pedido-status ${pedido.status}">${formatarStatus(pedido.status)}</span>
                    ${pedido.source === 'json_upload' ? `<span class="pedido-source garagem67">📁 JSON</span>` : ''}
                    ${pedido.source === 'garagem67' ? `<span class="pedido-source garagem67">🍸 GARAGEM67</span>` : ''}
                </div>
            </div>
            
            <div class="pedido-content">
                <div class="pedido-info">
                    <p class="pedido-description"><strong>📦 Descrição:</strong> ${pedido.description}</p>
                    <p><strong>🔢 Quantidade:</strong> ${pedido.quantity}</p>
                    
                    ${pedido.customer ? `
                        <div class="customer-info">
                            <div class="customer-header">
                                <strong>👤 Cliente:</strong> ${pedido.customer.name}
                            </div>
                            <div class="customer-details">
                                <span>📞 ${pedido.customer.phone}</span>
                                <span>📍 ${pedido.customer.address}</span>
                                ${pedido.customer.complement ? `<span>🏠 ${pedido.customer.complement}</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${pedido.total ? `<p><strong>💰 Total:</strong> R$ ${parseFloat(pedido.total).toFixed(2)}</p>` : ''}
                    
                    <div class="pedido-meta">
                        <span class="meta-item">🕐 ${formatarData(pedido.createdAt)}</span>
                        ${pedido.acceptedBy ? `<span class="meta-item">✅ ${pedido.acceptedByName || pedido.acceptedBy}</span>` : ''}
                        ${pedido.acceptedAt ? `<span class="meta-item">⏱️ ${formatarData(pedido.acceptedAt)}</span>` : ''}
                        ${pedido.metadata && pedido.metadata.original_file ? `<span class="meta-item">📁 ${pedido.metadata.original_file}</span>` : ''}
                    </div>
                </div>
                
                ${pedido.items && pedido.items.length > 0 ? `
                    <div class="pedido-items">
                        <strong>🛒 Itens:</strong>
                        <div class="items-list">
                            ${pedido.items.map(item => `
                                <div class="item">
                                    ${item.quantity}x ${item.name} - R$ ${parseFloat(item.price).toFixed(2)}
                                    ${item.total ? `<span class="item-total">(R$ ${parseFloat(item.total).toFixed(2)})</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="pedido-actions admin">
                ${pedido.status === 'pendente' ? `
                    <button class="btn-danger" onclick="excluirPedido('${pedido.id}')" title="Excluir pedido">
                        🗑️ Excluir
                    </button>
                    <button class="btn-secondary" onclick="atribuirEntregador('${pedido.id}')" title="Atribuir entregador">
                        👤 Atribuir
                    </button>
                ` : ''}
                
                ${pedido.status === 'aceito' ? `
                    <button class="btn-warning" onclick="atualizarStatusPedido('${pedido.id}', 'em_rota')" title="Marcar como em rota">
                        🚚 Em Rota
                    </button>
                ` : ''}
                
                ${pedido.status === 'em_rota' ? `
                    <button class="btn-success" onclick="atualizarStatusPedido('${pedido.id}', 'entregue')" title="Marcar como entregue">
                        ✅ Entregue
                    </button>
                ` : ''}
                
                <button class="btn-info" onclick="verDetalhesCompletos('${pedido.id}')" title="Ver detalhes completos">
                    📋 Detalhes
                </button>
            </div>
        </div>
    `).join('');
}

// Mensagem para estado vazio
function getEmptyStateMessage() {
    const activeFilter = document.querySelector('.btn-filter.active');
    const status = activeFilter ? activeFilter.getAttribute('data-status') : 'todos';
    
    const messages = {
        'todos': 'Não há pedidos no sistema.',
        'pendente': 'Não há pedidos pendentes no momento.',
        'aceito': 'Não há pedidos aceitos no momento.',
        'entregue': 'Não há pedidos entregues no momento.',
        'json_upload': 'Não há pedidos importados do Garagem67.'
    };
    
    return messages[status] || 'Não há pedidos para o filtro selecionado.';
}

// Carregar entregadores
async function carregarEntregadores() {
    try {
        showLoadingState('lista-entregadores', '🔄 Carregando entregadores...');

        const response = await fetch(`${BACKEND_URL}/entregadores`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            exibirEntregadores(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar entregadores:', error);
        showErrorState('lista-entregadores', '❌ Erro ao carregar entregadores.');
    }
}

// Exibir entregadores
function exibirEntregadores(entregadores) {
    if (!listaEntregadores) return;
    
    if (!entregadores || entregadores.length === 0) {
        listaEntregadores.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <h3>Nenhum entregador cadastrado</h3>
                <p>Os entregadores aparecerão aqui após se cadastrarem.</p>
            </div>
        `;
        return;
    }

    // Ordenar por status (aprovados primeiro) e data de cadastro
    entregadores.sort((a, b) => {
        if (a.status === 'aprovado' && b.status !== 'aprovado') return -1;
        if (a.status !== 'aprovado' && b.status === 'aprovado') return 1;
        return new Date(b.dataCadastro) - new Date(a.dataCadastro);
    });

    listaEntregadores.innerHTML = entregadores.map(entregador => `
        <div class="entregador-card ${entregador.status}">
            <div class="entregador-header">
                <div class="entregador-info">
                    <h3>${entregador.nome}</h3>
                    <span class="entregador-email">${entregador.userEmail}</span>
                </div>
                <div class="entregador-status-badge">
                    <span class="status ${entregador.status}">${formatarStatusEntregador(entregador.status)}</span>
                    ${entregador.verificado ? '<span class="badge verified">✅ Verificado</span>' : ''}
                </div>
            </div>
            
            <div class="entregador-content">
                <div class="entregador-details">
                    <div class="detail-group">
                        <span class="detail-label">📞 Telefone:</span>
                        <span class="detail-value">${formatarTelefone(entregador.telefone)}</span>
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">🚗 Veículo:</span>
                        <span class="detail-value">${formatarVeiculo(entregador.veiculo)}</span>
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">📍 Localização:</span>
                        <span class="detail-value">${entregador.cidade} - ${entregador.estado}</span>
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">🕐 Disponibilidade:</span>
                        <span class="detail-value">${formatarDisponibilidade(entregador.disponibilidade)}</span>
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">📅 Cadastrado em:</span>
                        <span class="detail-value">${formatarData(entregador.dataCadastro)}</span>
                    </div>
                    ${entregador.possuiCnh ? `
                        <div class="detail-group">
                            <span class="detail-label">📝 CNH:</span>
                            <span class="detail-value">${entregador.cnh || 'Número não informado'}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="entregador-stats">
                    <div class="stat">
                        <span class="stat-number">${calcularPedidosEntregador(entregador.userId)}</span>
                        <span class="stat-label">Pedidos</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${calcularTaxaEntrega(entregador.userId)}%</span>
                        <span class="stat-label">Taxa Sucesso</span>
                    </div>
                </div>
            </div>
            
            <div class="entregador-actions">
                ${entregador.status === 'pendente' ? `
                    <button class="btn-success" onclick="aprovarEntregador('${entregador.id}')">
                        ✅ Aprovar
                    </button>
                    <button class="btn-danger" onclick="rejeitarEntregador('${entregador.id}')">
                        ❌ Rejeitar
                    </button>
                ` : ''}
                
                ${entregador.status === 'aprovado' ? `
                    <button class="btn-warning" onclick="suspenderEntregador('${entregador.id}')">
                        ⏸️ Suspender
                    </button>
                ` : ''}
                
                ${entregador.status === 'rejeitado' || entregador.status === 'suspenso' ? `
                    <button class="btn-success" onclick="reativarEntregador('${entregador.id}')">
                        🔄 Reativar
                    </button>
                ` : ''}
                
                <button class="btn-info" onclick="verDetalhesEntregador('${entregador.id}')">
                    👁️ Detalhes
                </button>
                
                <button class="btn-secondary" onclick="entrarEmContato('${entregador.telefone}')">
                    💬 Contato
                </button>
            </div>
        </div>
    `).join('');
}

// Funções administrativas
async function excluirPedido(pedidoId) {
    if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/pedidos/${pedidoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        if (response.ok) {
            showNotification('✅ Pedido excluído com sucesso!', 'success');
            await carregarPedidosAdmin();
        } else {
            throw new Error('Erro ao excluir pedido');
        }
    } catch (error) {
        console.error('❌ Erro ao excluir pedido:', error);
        showNotification('❌ Erro ao excluir pedido.', 'error');
    }
}

async function atribuirEntregador(pedidoId) {
    // Implementar lógica de atribuição de entregador
    showNotification('👤 Funcionalidade de atribuição em desenvolvimento', 'info');
}

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
            showNotification(`✅ Status do pedido atualizado para: ${formatarStatus(novoStatus)}`, 'success');
            await carregarPedidosAdmin();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        showNotification('❌ Erro ao atualizar status: ' + error.message, 'error');
    }
}

// Funções para gerenciar entregadores
async function aprovarEntregador(entregadorId) {
    if (!confirm('Deseja aprovar este entregador?')) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/entregadores/${entregadorId}/aprovar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ aprovado: true })
        });

        if (response.ok) {
            showNotification('✅ Entregador aprovado com sucesso!', 'success');
            await carregarEntregadores();
        } else {
            throw new Error('Erro ao aprovar entregador');
        }
    } catch (error) {
        console.error('❌ Erro ao aprovar entregador:', error);
        showNotification('❌ Erro ao aprovar entregador.', 'error');
    }
}

async function rejeitarEntregador(entregadorId) {
    if (!confirm('Deseja rejeitar este entregador?')) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/entregadores/${entregadorId}/aprovar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ aprovado: false })
        });

        if (response.ok) {
            showNotification('❌ Entregador rejeitado.', 'success');
            await carregarEntregadores();
        } else {
            throw new Error('Erro ao rejeitar entregador');
        }
    } catch (error) {
        console.error('❌ Erro ao rejeitar entregador:', error);
        showNotification('❌ Erro ao rejeitar entregador.', 'error');
    }
}

async function suspenderEntregador(entregadorId) {
    // Implementar suspensão de entregador
    showNotification('⏸️ Funcionalidade de suspensão em desenvolvimento', 'info');
}

async function reativarEntregador(entregadorId) {
    // Implementar reativação de entregador
    showNotification('🔄 Funcionalidade de reativação em desenvolvimento', 'info');
}

// Funções auxiliares
function formatarData(dataString) {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatarStatus(status) {
    const statusMap = {
        'pendente': '⏳ Pendente',
        'aceito': '✅ Aceito',
        'em_rota': '🚚 Em Rota',
        'entregue': '🎉 Entregue',
        'cancelado': '❌ Cancelado'
    };
    return statusMap[status] || status;
}

function formatarStatusEntregador(status) {
    const statusMap = {
        'pendente': '⏳ Pendente',
        'aprovado': '✅ Aprovado',
        'rejeitado': '❌ Rejeitado',
        'suspenso': '⏸️ Suspenso'
    };
    return statusMap[status] || status;
}

function formatarTelefone(telefone) {
    if (!telefone) return 'N/A';
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.substring(0,2)}) ${cleaned.substring(2,7)}-${cleaned.substring(7)}`;
    }
    return telefone;
}

function formatarVeiculo(veiculo) {
    const veiculoMap = {
        'moto': '🏍️ Moto',
        'carro': '🚗 Carro',
        'bicicleta': '🚴 Bicicleta',
        'caminhao': '🚚 Caminhão'
    };
    return veiculoMap[veiculo] || veiculo;
}

function formatarDisponibilidade(disponibilidade) {
    const disponibilidadeMap = {
        'manha': '🌅 Manhã (6h-12h)',
        'tarde': '☀️ Tarde (12h-18h)',
        'noite': '🌙 Noite (18h-00h)',
        'madrugada': '🌌 Madrugada (00h-6h)',
        'integral': '🕐 Período Integral',
        'flexivel': '⚡ Horários Flexíveis'
    };
    return disponibilidadeMap[disponibilidade] || disponibilidade;
}

function calcularPedidosEntregador(userId) {
    // Implementar cálculo de pedidos por entregador
    return Math.floor(Math.random() * 20); // Placeholder
}

function calcularTaxaEntrega(userId) {
    // Implementar cálculo de taxa de entrega
    return Math.floor(Math.random() * 30) + 70; // Placeholder
}

function verDetalhesCompletos(pedidoId) {
    const pedido = allPedidos.find(p => p.id === pedidoId);
    if (pedido) {
        const detalhes = JSON.stringify(pedido, null, 2);
        console.log('📋 Detalhes completos do pedido:', pedido);
        
        // Criar modal com detalhes completos
        const modal = document.createElement('div');
        modal.className = 'modal detalhes-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>📋 Detalhes Completos do Pedido</h2>
                <div class="detalhes-content">
                    <pre>${detalhes}</pre>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Fechar</button>
                    <button class="btn-primary" onclick="copiarParaAreaTransferencia('${detalhes.replace(/'/g, "\\'")}')">📋 Copiar JSON</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fechar modal
        modal.querySelector('.close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

function verDetalhesEntregador(entregadorId) {
    showNotification('👤 Visualizando detalhes do entregador', 'info');
    // Implementar modal de detalhes do entregador
}

function entrarEmContato(telefone) {
    const whatsappUrl = `https://wa.me/55${telefone.replace(/\D/g, '')}`;
    window.open(whatsappUrl, '_blank');
}

function copiarParaAreaTransferencia(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        showNotification('✅ JSON copiado para a área de transferência!', 'success');
    }).catch(err => {
        showNotification('❌ Erro ao copiar texto', 'error');
    });
}

// Estados de interface
function showLoadingState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
}

function showErrorState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Erro ao carregar</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="location.reload()">🔄 Tentar Novamente</button>
            </div>
        `;
    }
}

function showNotification(message, type = 'info') {
    // Remover notificações existentes
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });

    // Criar notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Adicionar estilos se não existirem
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                font-weight: bold;
                z-index: 10000;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
                animation: slideInRight 0.3s ease;
            }
            .notification.success {
                background: #27ae60;
                color: white;
            }
            .notification.error {
                background: #e74c3c;
                color: white;
            }
            .notification.info {
                background: #3498db;
                color: white;
            }
            .notification.warning {
                background: #f39c12;
                color: white;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.2em;
                cursor: pointer;
                margin-left: 10px;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Auto-atualização
function iniciarAutoAtualizacao() {
    // Atualizar a cada 30 segundos
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
        showNotification('✅ Admin criado com sucesso! Recarregue a página.', 'success');
        setTimeout(() => location.reload(), 2000);
    })
    .catch(error => {
        console.error('❌ Erro ao criar admin:', error);
        showNotification('❌ Erro ao criar admin: ' + error.message, 'error');
    });
};

// Exportar funções para uso global
window.excluirPedido = excluirPedido;
window.atribuirEntregador = atribuirEntregador;
window.atualizarStatusPedido = atualizarStatusPedido;
window.aprovarEntregador = aprovarEntregador;
window.rejeitarEntregador = rejeitarEntregador;
window.suspenderEntregador = suspenderEntregador;
window.reativarEntregador = reativarEntregador;
window.verDetalhesCompletos = verDetalhesCompletos;
window.verDetalhesEntregador = verDetalhesEntregador;
window.entrarEmContato = entrarEmContato;
window.copiarParaAreaTransferencia = copiarParaAreaTransferencia;

// Sistema de promoção para admin (para super admins)
class AdminPromotionSystem {
    constructor() {
        this.setupPromotionUI();
    }

    setupPromotionUI() {
        // Adicionar botão de promoção no painel admin
        const adminSection = document.querySelector('#entregadores');
        if (adminSection) {
            const promoteButton = document.createElement('button');
            promoteButton.className = 'btn-primary';
            promoteButton.innerHTML = '👑 Promover para Admin';
            promoteButton.style.marginBottom = '20px';
            promoteButton.onclick = () => this.showPromotionModal();
            
            adminSection.querySelector('.section-header').appendChild(promoteButton);
        }
    }

    showPromotionModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="close">&times;</span>
                <h2>👑 Promover Usuário para Admin</h2>
                <div class="form-group">
                    <label for="admin-email">Email do Usuário:</label>
                    <input type="email" id="admin-email" placeholder="Digite o email do usuário">
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="window.adminPromotion.promoteUser()">Promover</button>
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Fechar modal
        modal.querySelector('.close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async promoteUser() {
        const emailInput = document.getElementById('admin-email');
        const email = emailInput.value.trim();

        if (!email) {
            alert('❌ Por favor, digite um email válido.');
            return;
        }

        try {
            const user = firebase.auth().currentUser;
            const token = await user.getIdToken();

            const response = await fetch(`${window.BACKEND_URL}/admin/promote-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Usuário promovido a administrador com sucesso!');
                document.querySelector('.modal').remove();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('❌ Erro ao promover usuário:', error);
            alert('❌ Erro ao promover usuário: ' + error.message);
        }
    }
}

// Adicione esta rota ao seu backend:
app.post('/admin/promote-user', authenticate, isAdmin, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email é obrigatório'
            });
        }

        // Buscar usuário pelo email
        let userDoc;
        if (firebaseInitialized) {
            const usersSnapshot = await db.collection('users')
                .where('email', '==', email)
                .get();

            if (usersSnapshot.empty) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            userDoc = usersSnapshot.docs[0];
            await userDoc.ref.update({
                role: 'admin',
                updatedAt: new Date().toISOString()
            });
        } else {
            const user = users.find(u => u.email === email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }
            user.role = 'admin';
        }

        res.json({
            success: true,
            message: '✅ Usuário promovido a administrador!',
            user: { email, role: 'admin' }
        });

    } catch (error) {
        console.error('❌ Erro ao promover usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});