// URL do backend local
const BACKEND_URL = 'http://localhost:3000';

// Elementos DOM
const cadastroForm = document.getElementById('cadastro-form');
const btnSubmit = document.getElementById('btn-submit');
const confirmacaoModal = document.getElementById('confirmacao-modal');
const closeModal = document.querySelector('.close');
const btnFechar = document.getElementById('btn-fechar');

// Máscaras para os campos
function aplicarMascaras() {
    // Máscara para CPF
    const cpfInput = document.getElementById('cpf');
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        
        e.target.value = value;
    });
    
    // Máscara para telefone
    const telefoneInput = document.getElementById('telefone');
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        
        if (value.length <= 11) {
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        }
        
        e.target.value = value;
    });
    
    // Máscara para CEP
    const cepInput = document.getElementById('cep');
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.substring(0, 8);
        
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        
        e.target.value = value;
    });
}

// Validação de CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digito1 = resto >= 10 ? 0 : resto;
    
    if (digito1 !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digito2 = resto >= 10 ? 0 : resto;
    
    if (digito2 !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// Validação de telefone
function validarTelefone(telefone) {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    return telefoneLimpo.length === 10 || telefoneLimpo.length === 11;
}

// Validação de CEP
function validarCEP(cep) {
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.length === 8;
}

// Envio do formulário
cadastroForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Obter dados do formulário
    const formData = new FormData(cadastroForm);
    const dados = {
        nome: formData.get('nome'),
        cpf: formData.get('cpf'),
        telefone: formData.get('telefone'),
        veiculo: formData.get('veiculo'),
        endereco: formData.get('endereco'),
        cidade: formData.get('cidade'),
        estado: formData.get('estado'),
        cep: formData.get('cep'),
        disponibilidade: formData.get('disponibilidade'),
        observacoes: formData.get('observacoes'),
        dataCadastro: new Date().toISOString()
    };
    
    // Validações
    if (!validarCPF(dados.cpf)) {
        alert('Por favor, insira um CPF válido.');
        return;
    }
    
    if (!validarTelefone(dados.telefone)) {
        alert('Por favor, insira um telefone válido (com DDD).');
        return;
    }
    
    if (!validarCEP(dados.cep)) {
        alert('Por favor, insira um CEP válido.');
        return;
    }
    
    // Limpar CPF, telefone e CEP para salvar apenas números
    dados.cpf = dados.cpf.replace(/\D/g, '');
    dados.telefone = dados.telefone.replace(/\D/g, '');
    dados.cep = dados.cep.replace(/\D/g, '');
    
    // Mostrar estado de carregamento
    btnSubmit.classList.add('loading');
    btnSubmit.disabled = true;
    
    try {
        // Enviar dados para o backend
        const response = await fetch(`${BACKEND_URL}/cadastro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });
        
        if (response.ok) {
            // Sucesso
            mostrarConfirmacao();
            cadastroForm.reset();
        } else {
            // Erro do servidor
            const errorData = await response.json();
            alert(`Erro ao enviar cadastro: ${errorData.message || 'Tente novamente mais tarde.'}`);
        }
    } catch (error) {
        // Erro de rede
        console.error('Erro ao enviar cadastro:', error);
        alert('Erro de conexão. Verifique se o servidor backend está rodando na porta 3000.');
    } finally {
        // Restaurar botão
        btnSubmit.classList.remove('loading');
        btnSubmit.disabled = false;
    }
});

// Mostrar modal de confirmação
function mostrarConfirmacao() {
    confirmacaoModal.style.display = 'flex';
}

// Fechar modal
closeModal.addEventListener('click', function() {
    confirmacaoModal.style.display = 'none';
});

btnFechar.addEventListener('click', function() {
    confirmacaoModal.style.display = 'none';
});

// Fechar modal ao clicar fora
window.addEventListener('click', function(e) {
    if (e.target === confirmacaoModal) {
        confirmacaoModal.style.display = 'none';
    }
});

// Inicializar máscaras quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', aplicarMascaras);

// Smooth scroll para navegação
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

// Função melhorada para mostrar erros
function mostrarErro(mensagem) {
    alert(`❌ Erro: ${mensagem}`);
    console.error('Erro no frontend:', mensagem);
}

// Atualize a função de envio do formulário:
cadastroForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Obter dados do formulário
    const formData = new FormData(cadastroForm);
    const dados = {
        nome: formData.get('nome'),
        cpf: formData.get('cpf'),
        telefone: formData.get('telefone'),
        veiculo: formData.get('veiculo'),
        endereco: formData.get('endereco'),
        cidade: formData.get('cidade'),
        estado: formData.get('estado'),
        cep: formData.get('cep'),
        disponibilidade: formData.get('disponibilidade'),
        observacoes: formData.get('observacoes')
    };
    
    // Validações
    if (!validarCPF(dados.cpf)) {
        mostrarErro('Por favor, insira um CPF válido.');
        return;
    }
    
    if (!validarTelefone(dados.telefone)) {
        mostrarErro('Por favor, insira um telefone válido (com DDD).');
        return;
    }
    
    if (!validarCEP(dados.cep)) {
        mostrarErro('Por favor, insira um CEP válido.');
        return;
    }
    
    // Limpar CPF, telefone e CEP para salvar apenas números
    dados.cpf = dados.cpf.replace(/\D/g, '');
    dados.telefone = dados.telefone.replace(/\D/g, '');
    dados.cep = dados.cep.replace(/\D/g, '');
    
    // Mostrar estado de carregamento
    btnSubmit.classList.add('loading');
    btnSubmit.disabled = true;
    
    try {
        console.log('📤 Enviando dados para o backend:', dados);
        
        // Enviar dados para o backend
        const response = await fetch(`${BACKEND_URL}/cadastro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Sucesso
            mostrarConfirmacao();
            cadastroForm.reset();
            console.log('✅ Cadastro realizado com sucesso:', result);
        } else {
            // Erro do servidor
            mostrarErro(result.message || 'Erro ao enviar cadastro. Tente novamente.');
            console.error('❌ Erro do servidor:', result);
        }
    } catch (error) {
        // Erro de rede
        mostrarErro('Erro de conexão. Verifique se o servidor backend está rodando.');
        console.error('❌ Erro de rede:', error);
    } finally {
        // Restaurar botão
        btnSubmit.classList.remove('loading');
        btnSubmit.disabled = false;
    }
});