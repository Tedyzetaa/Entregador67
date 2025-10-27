// No método exibirPedidosAdmin, adicione esta verificação:
function exibirPedidosAdmin(pedidos) {
    if (!listaPedidosAdmin) return;
    
    if (pedidos.length === 0) {
        listaPedidosAdmin.innerHTML = '<div class="sem-dados">📝 Nenhum pedido encontrado.</div>';
        return;
    }

    listaPedidosAdmin.innerHTML = pedidos.map(pedido => `
        <div class="pedido-card admin ${pedido.status} ${pedido.source ? 'external-order' : ''}" data-pedido-id="${pedido.id}">
            <div class="pedido-header">
                <h3>Pedido #${pedido.id}</h3>
                <div class="pedido-badges">
                    <span class="pedido-status ${pedido.status}">${pedido.status.toUpperCase()}</span>
                    ${pedido.source ? `<span class="pedido-source ${pedido.source}">${pedido.source.toUpperCase()}</span>` : ''}
                    ${pedido.external_id ? `<span class="external-id">🔗 ${pedido.external_id.substring(0, 8)}...</span>` : ''}
                </div>
            </div>
            <div class="pedido-content">
                <p><strong>📦 Descrição:</strong> ${pedido.description}</p>
                <p><strong>🔢 Quantidade:</strong> ${pedido.quantity}</p>
                ${pedido.customer ? `
                    <div class="customer-info">
                        <p><strong>👤 Cliente:</strong> ${pedido.customer.name}</p>
                        <p><strong>📞 Telefone:</strong> ${pedido.customer.phone}</p>
                        <p><strong>📍 Endereço:</strong> ${pedido.customer.address}</p>
                        ${pedido.customer.complement ? `<p><strong>🏠 Complemento:</strong> ${pedido.customer.complement}</p>` : ''}
                    </div>
                ` : ''}
                ${pedido.total ? `<p><strong>💰 Total:</strong> R$ ${parseFloat(pedido.total).toFixed(2)}</p>` : ''}
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