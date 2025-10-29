class JSONUploadManager {
    constructor() {
        this.initializeEventListeners();
        console.log('📁 Inicializando JSONUploadManager...');
    }

    initializeEventListeners() {
        const dropArea = document.getElementById('drop-area');
        const fileInput = document.getElementById('file-input');
        const selectButton = document.getElementById('select-files');

        // Event listeners para drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => this.highlight(dropArea), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => this.unhighlight(dropArea), false);
        });

        dropArea.addEventListener('drop', (e) => this.handleDrop(e), false);

        // Event listeners para seleção de arquivos
        selectButton.addEventListener('click', () => fileInput.click(), false);
        fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.classList.add('highlight');
    }

    unhighlight(element) {
        element.classList.remove('highlight');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        if (!files.length) return;

        console.log(`📂 ${files.length} arquivo(s) selecionado(s)`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.processFile(file);
        }
    }

    async processFile(file) {
        console.log('🔄 Processando arquivo:', file.name, file);

        // Verificar se é um arquivo JSON
        if (!file.name.endsWith('.json')) {
            this.showError(file.name, 'Arquivo não é um JSON');
            return;
        }

        try {
            // Primeiro, validar o JSON
            const jsonContent = await this.validateJSON(file);
            
            // Se for válido, enviar para o backend
            await this.uploadToBackend(file, jsonContent);
            
        } catch (error) {
            console.error('❌ Erro ao processar arquivo:', error);
            this.showError(file.name, error.message);
        }
    }

    async validateJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    
                    // Validar estrutura básica do JSON
                    if (!json.order_id) {
                        throw new Error('JSON não possui order_id');
                    }
                    if (!json.customer) {
                        throw new Error('JSON não possui customer');
                    }
                    if (!json.items || !Array.isArray(json.items)) {
                        throw new Error('JSON não possui items array');
                    }
                    
                    resolve(json);
                } catch (error) {
                    reject(new Error(`JSON inválido: ${error.message}`));
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    async uploadToBackend(file, jsonContent) {
        try {
            const formData = new FormData();
            formData.append('jsonFile', file);
            formData.append('jsonData', JSON.stringify(jsonContent));

            const response = await fetch('/api/upload-json', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const result = await response.json();
            this.showSuccess(file.name);
            console.log('✅ Arquivo processado com sucesso:', result);

        } catch (error) {
            console.error('❌ Erro ao enviar para backend:', error);
            throw new Error(`Falha no upload: ${error.message}`);
        }
    }

    showError(fileName, message) {
        this.updateStatus(fileName, `❌ Erro: ${message}`, 'error');
    }

    showSuccess(fileName) {
        this.updateStatus(fileName, '✅ Importado com sucesso!', 'success');
    }

    updateStatus(fileName, message, type) {
        // Encontrar ou criar um elemento para mostrar o status
        let statusElement = document.getElementById(`status-${fileName}`);
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = `status-${fileName}`;
            statusElement.className = 'file-status';
            document.getElementById('drop-area').appendChild(statusElement);
        }

        statusElement.textContent = `${fileName}: ${message}`;
        statusElement.className = `file-status ${type}`;
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new JSONUploadManager();
});