// Configuração do backend
const BACKEND_URL = 'https://entregador67.railway.internal';

// app.js - Funções gerais atualizadas

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    initSmoothScroll();
});

// Inicializar aplicação
function initApp() {
    console.log('🚀 Entregadores 67 - Sistema inicializado');
    
    // Verificar status do backend
    checkBackendStatus();
}

// Verificar status do backend
async function checkBackendStatus() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'OK') {
            console.log('✅ Backend conectado');
        }
    } catch (error) {
        console.warn('⚠️ Backend não disponível');
    }
}

// Smooth scroll para navegação
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Funções utilitárias
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Implementação básica de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${tipo}`;
    notification.textContent = mensagem;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#27ae60' : tipo === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Exportar funções para uso global
window.Entregadores67 = {
    formatarMoeda,
    formatarData,
    mostrarNotificacao,
    BACKEND_URL
};