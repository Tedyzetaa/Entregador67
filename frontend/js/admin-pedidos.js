// admin-pedidos.js - Gerenciamento de pedidos no painel admin
class PedidosManager {
    constructor() {
        this.pedidos = [];
        this.init();
    }

    init() {
        console.log('📦 Inicializando PedidosManager...');
        this.setupEventListeners();
        this.carregarPedidos();
    }

    setupEventListeners() {
        // Botão criar pedido
        const btnCriarPedido = document.getElementById('btn-criar-pedido');
        if (btnCriarPedido) {
            btnCriarPedido.addEventListener('click', () => {
                this.abrirModalCriarPedido();
            });
        }

        // Botão atualizar lista
        const btnAtualizar = document.getElementById('btn-atualizar-pedidos');
        if (btnAtualizar) {
            btnAtualizar.addEventListener('click', () => {
                this.carregarPedidos();
            });
        }

        // Filtros
        const filtroStatus = document.getElementById('filtro-status');
        if (filtroStatus) {
            filtroStatus.addEventListener('change', () => {
                this.filtrarPedidos();
            });
        }
    }

    async carregarPedidos() {
        try {
            console.log('📥 Carregando pedidos...');
            
            const user = firebase.auth().currentUser;
            if (!user) {
                console.error('❌ Usuário não autenticado');
                return;
            }

            const token = await user.getIdToken();
            
            const response = await fetch('https://entregador67-production.up.railway.app/pedidos', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.pedidos = result.data;
                console.log(`✅ ${this.pedidos.length} pedidos carregados`);
                this.renderPedidos();
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('❌ Erro ao carregar pedidos:', error);
            this.mostrarErro('Erro ao carregar pedidos: ' + error.message);
        }
    }

    renderPedidos() {
        const container = document.getElementById('lista-pedidos');
        if (!container) return;

        if (this.pedidos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📦 Nenhum pedido encontrado</p>
                    <p>Crie o primeiro pedido usando o botão acima</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.pedidos.map(pedido => `
            <div class="pedido-card" data-id="${pedido.id}">
                <div class="pedido-header">
                    <h4>${pedido.description}</h4>
                    <span class="pedido-status ${pedido.status}">${this.formatarStatus(pedido.status)}</span>
                </div>
                <div class="pedido-info">
                    <p><strong>Quantidade:</strong> ${pedido.quantity}</p>
                    <p><strong>Criado por:</strong> ${pedido.createdByName}</p>
                    <p><strong>Data:</strong> ${new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
                    ${pedido.acceptedByName ? `<p><strong>Aceito por:</strong> ${pedido.acceptedByName}</p>` : ''}
                </div>
                <div class="pedido-actions">
                    ${pedido.status === 'pendente' ? `
                        <button class="btn-action btn-aceitar" onclick="window.pedidosManager.aceitarPedido('${pedido.id}')">
                            ✅ Aceitar
                        </button>
                    ` : ''}
                    ${pedido.status === 'aceito' ? `
                        <button class="btn-action btn-em-rota" onclick="window.pedidosManager.atualizarStatus('${pedido.id}', 'em_rota')">
                            🚚 Em Rota
                        </button>
                    ` : ''}
                    ${pedido.status === 'em_rota' ? `
                        <button class="btn-action btn-entregue" onclick="window.pedidosManager.atualizarStatus('${pedido.id}', 'entregue')">
                            🎉 Entregue
                        </button>
                    ` : ''}
                    <button class="btn-action btn-detalhes" onclick="window.pedidosManager.verDetalhes('${pedido.id}')">
                        📋 Detalhes
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatarStatus(status) {
        const statusMap = {
            'pendente': '⏳ Pendente',
            'aceito': '✅ Aceito',
            'em_rota': '🚚 Em Rota',
            'entregue': '🎉 Entregue',
            'cancelado': '❌ Cancelado'
        };
        return statusMap[status] || status;
    }

    abrirModalCriarPedido() {
        // Implementar modal para criar pedido
        const descricao = prompt('Descrição do pedido:');
        const quantidade = prompt('Quantidade:');
        
        if (descricao && quantidade) {
            this.criarPedido(descricao, parseInt(quantidade));
        }
    }

    async criarPedido(description, quantity) {
        try {
            console.log('📝 Criando pedido...');
            
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const token = await user.getIdToken();
            
            const response = await fetch('https://entregador67-production.up.railway.app/pedidos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description,
                    quantity
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Pedido criado com sucesso:', result.pedido);
                this.mostrarSucesso('Pedido criado com sucesso!');
                this.carregarPedidos(); // Recarregar lista
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('❌ Erro ao criar pedido:', error);
            this.mostrarErro('Erro ao criar pedido: ' + error.message);
        }
    }

    async aceitarPedido(pedidoId) {
        try {
            console.log('✅ Aceitando pedido:', pedidoId);
            
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const token = await user.getIdToken();
            
            const response = await fetch(`https://entregador67-production.up.railway.app/pedidos/${pedidoId}/aceitar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Pedido aceito com sucesso');
                this.mostrarSucesso('Pedido aceito com sucesso!');
                this.carregarPedidos(); // Recarregar lista
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('❌ Erro ao aceitar pedido:', error);
            this.mostrarErro('Erro ao aceitar pedido: ' + error.message);
        }
    }

    async atualizarStatus(pedidoId, status) {
        try {
            console.log(`🔄 Atualizando status do pedido ${pedidoId} para ${status}`);
            
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const token = await user.getIdToken();
            
            const response = await fetch(`https://entregador67-production.up.railway.app/pedidos/${pedidoId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Status atualizado com sucesso');
                this.mostrarSucesso('Status atualizado com sucesso!');
                this.carregarPedidos(); // Recarregar lista
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            this.mostrarErro('Erro ao atualizar status: ' + error.message);
        }
    }

    verDetalhes(pedidoId) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        if (pedido) {
            const detalhes = `
Descrição: ${pedido.description}
Quantidade: ${pedido.quantity}
Status: ${this.formatarStatus(pedido.status)}
Criado por: ${pedido.createdByName}
Data: ${new Date(pedido.createdAt).toLocaleString('pt-BR')}
${pedido.acceptedByName ? `Aceito por: ${pedido.acceptedByName}\nData aceitação: ${new Date(pedido.acceptedAt).toLocaleString('pt-BR')}` : ''}
Última atualização: ${new Date(pedido.updatedAt).toLocaleString('pt-BR')}
            `.trim();
            
            alert(detalhes);
        }
    }

    filtrarPedidos() {
        const filtroStatus = document.getElementById('filtro-status');
        if (!filtroStatus) return;

        const status = filtroStatus.value;
        let pedidosFiltrados = this.pedidos;

        if (status !== 'todos') {
            pedidosFiltrados = this.pedidos.filter(pedido => pedido.status === status);
        }

        this.renderPedidosFiltrados(pedidosFiltrados);
    }

    renderPedidosFiltrados(pedidosFiltrados) {
        const container = document.getElementById('lista-pedidos');
        if (!container) return;

        if (pedidosFiltrados.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📦 Nenhum pedido encontrado para o filtro selecionado</p>
                </div>
            `;
            return;
        }

        // Reutiliza a mesma lógica de renderização
        this.pedidos = pedidosFiltrados;
        this.renderPedidos();
    }

    mostrarSucesso(mensagem) {
        // Implementar notificação de sucesso
        alert('✅ ' + mensagem);
    }

    mostrarErro(mensagem) {
        // Implementar notificação de erro
        alert('❌ ' + mensagem);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Inicializando PedidosManager...');
    window.pedidosManager = new PedidosManager();
});