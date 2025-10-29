// json-upload.js - Sistema de upload de arquivos JSON corrigido
class JSONUploadManager {
    constructor() {
        this.uploadedFiles = [];
        this.init();
    }

    init() {
        console.log('📁 Inicializando JSONUploadManager...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('json-file-input');

        if (!uploadArea || !fileInput) {
            console.warn('⚠️ Elementos de upload não encontrados');
            return;
        }

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    handleFiles(files) {
        if (files.length === 0) return;

        console.log(`📂 ${files.length} arquivo(s) selecionado(s)`);
        
        this.updateUploadStatus(`Processando ${files.length} arquivo(s)...`);

        Array.from(files).forEach(file => {
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                this.processFile(file);
            } else {
                this.showError(`${file.name} não é um arquivo JSON válido`);
            }
        });
    }

    async processFile(file) {
        try {
            const fileContent = await this.readFileContent(file);
            const orderData = JSON.parse(fileContent);
            
            console.log(`🔄 Processando arquivo: ${file.name}`, orderData);

            // Validar estrutura básica
            if (!this.validateJSONStructure(orderData)) {
                throw new Error('Estrutura do JSON inválida');
            }

            await this.sendToBackend(file.name, orderData);

        } catch (error) {
            console.error(`❌ Erro ao processar ${file.name}:`, error);
            this.showError(`Erro em ${file.name}: ${error.message}`);
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    validateJSONStructure(data) {
        return data && 
               data.customer && 
               data.items && 
               Array.isArray(data.items) && 
               data.items.length > 0 &&
               data.customer.name &&
               data.customer.phone;
    }

    async sendToBackend(fileName, orderData) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const token = await user.getIdToken();

            const response = await fetch(`${window.BACKEND_URL}/api/upload-json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileName: fileName,
                    fileContent: orderData
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Arquivo processado com sucesso:', result);
                this.showSuccess(fileName, result.order);
                this.addToUploadedFilesList(fileName, result.order, 'success');
                
                // Atualizar lista de pedidos
                if (window.carregarPedidosAdmin) {
                    setTimeout(() => window.carregarPedidosAdmin(), 1000);
                }
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('❌ Erro ao enviar para backend:', error);
            this.showError(`Erro ao enviar ${fileName}: ${error.message}`);
            this.addToUploadedFilesList(fileName, null, 'error', error.message);
        }
    }

    showSuccess(fileName, order) {
        this.updateUploadStatus(`✅ ${fileName} importado com sucesso!`);
        
        // Notificação visual
        this.showNotification(`✅ Pedido de ${order.customer} importado! ID: ${order.internal_id}`, 'success');
    }

    showError(message) {
        this.updateUploadStatus(`❌ ${message}`);
        this.showNotification(message, 'error');
    }

    updateUploadStatus(message) {
        const statusElement = document.getElementById('upload-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = message.includes('✅') ? 'status-success' : 
                                    message.includes('❌') ? 'status-error' : 'status-info';
        }
    }

    addToUploadedFilesList(fileName, order, status, errorMessage = '') {
        const container = document.getElementById('uploaded-files');
        if (!container) return;

        const fileElement = document.createElement('div');
        fileElement.className = `uploaded-file ${status}`;
        
        if (status === 'success') {
            fileElement.innerHTML = `
                <div class="file-header">
                    <span class="file-name">✅ ${fileName}</span>
                    <span class="file-status success">IMPORTADO</span>
                </div>
                <div class="file-details">
                    <p><strong>Cliente:</strong> ${order.customer}</p>
                    <p><strong>ID do Pedido:</strong> ${order.internal_id}</p>
                    <p><strong>Total:</strong> R$ ${parseFloat(order.total).toFixed(2)}</p>
                    <p><strong>Itens:</strong> ${order.items} item(s)</p>
                    <p><strong>Status:</strong> <span class="status-pendente">Pendente</span></p>
                </div>
            `;
        } else {
            fileElement.innerHTML = `
                <div class="file-header">
                    <span class="file-name">❌ ${fileName}</span>
                    <span class="file-status error">ERRO</span>
                </div>
                <div class="file-details">
                    <p><strong>Erro:</strong> ${errorMessage}</p>
                </div>
            `;
        }

        container.insertBefore(fileElement, container.firstChild);
    }

    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Adicionar ao corpo
        document.body.appendChild(notification);

        // Remover após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    window.jsonUploadManager = new JSONUploadManager();
});