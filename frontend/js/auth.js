// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAO2fMl8KCASY_oTqX5PeHnM4ivBSOFcYQ",
    authDomain: "entregador67-859a4.firebaseapp.com",
    projectId: "entregador67-859a4",
    storageBucket: "entregador67-859a4.firebasestorage.app",
    messagingSenderId: "314820422641",
    appId: "1:314820422641:web:12685b9bf66287a7aaf250",
    measurementId: "G-H6TN06K0XK"
};

// Backend URL - ATUALIZE COM SUA URL
// NOVA URL - use esta:
const BACKEND_URL = 'https://entregador67-production.up.railway.app';

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Elementos DOM
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');
const loginModal = document.getElementById('login-modal');
const cadastroModal = document.getElementById('cadastro-modal');
const closeButtons = document.querySelectorAll('.close');
const heroCadastroBtn = document.getElementById('hero-cadastro-btn');
const btnGoogleLogin = document.getElementById('btn-google-login');
const btnAppleLogin = document.getElementById('btn-apple-login');
const btnEmailLogin = document.getElementById('btn-email-login');
const cadastroForm = document.getElementById('cadastro-form');
const btnSubmitCadastro = document.getElementById('btn-submit-cadastro');

// Estado da aplicação
let currentUser = null;
let userToken = null;
let userRole = null;

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initEventListeners();
    aplicarMascaras();
    initCNHLogic();
});

// Inicializar autenticação
function initAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            userToken = await user.getIdToken();
            await registerUserInBackend(user);
            await checkUserProfile();
            showUserInfo(user);
        } else {
            currentUser = null;
            userToken = null;
            userRole = null;
            hideUserInfo();
        }
    });
}

// Registrar usuário no backend após login social
async function registerUserInBackend(user) {
    try {
        const response = await fetch(`${BACKEND_URL}/register-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                role: 'entregador' // Default role
            })
        });

        const result = await response.json();
        
        if (result.success) {
            userRole = result.user.role;
            console.log('✅ Usuário registrado no backend:', result.user);
            return result.user;
        } else {
            console.error('❌ Erro ao registrar usuário:', result.message);
        }
    } catch (error) {
        console.error('❌ Erro ao conectar com backend:', error);
    }
}

// Verificar se usuário já tem perfil completo
async function checkUserProfile() {
    if (!currentUser || !userToken) return;

    try {
        // Verificar se é admin
        if (userRole === 'admin') {
            redirectToAdmin();
            return;
        }

        // Verificar se já completou cadastro de entregador
        const response = await fetch(`${BACKEND_URL}/entregadores`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const userEntregador = result.data.find(e => e.userId === currentUser.uid);
            
            if (userEntregador) {
                // Já tem cadastro completo, redirecionar para área do entregador
                redirectToEntregador();
            } else {
                // Não tem cadastro, mostrar modal
                showCadastroModal();
            }
        }
    } catch (error) {
        console.error('❌ Erro ao verificar perfil:', error);
    }
}

// Inicializar event listeners
function initEventListeners() {
    // Botões de login
    loginBtn.addEventListener('click', showLoginModal);
    logoutBtn.addEventListener('click', handleLogout);
    heroCadastroBtn.addEventListener('click', showLoginModal);

    // Fechar modais
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            loginModal.style.display = 'none';
            cadastroModal.style.display = 'none';
        });
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === cadastroModal) cadastroModal.style.display = 'none';
    });

    // Login social
    btnGoogleLogin.addEventListener('click', handleGoogleLogin);
    btnAppleLogin.addEventListener('click', handleAppleLogin);
    btnEmailLogin.addEventListener('click', handleEmailLogin);

    // Formulário de cadastro
    cadastroForm.addEventListener('submit', handleCadastroSubmit);
}

// Lógica do campo CNH
function initCNHLogic() {
    const possuiCnhSelect = document.getElementById('possuiCnh');
    const cnhContainer = document.getElementById('cnhContainer');

    if (possuiCnhSelect && cnhContainer) {
        possuiCnhSelect.addEventListener('change', function() {
            if (this.value === 'sim') {
                cnhContainer.style.display = 'block';
            } else {
                cnhContainer.style.display = 'none';
            }
        });
    }
}

// Mostrar modal de login
function showLoginModal() {
    loginModal.style.display = 'flex';
}

// Mostrar modal de cadastro
function showCadastroModal() {
    cadastroModal.style.display = 'flex';
    loginModal.style.display = 'none';
}

// Login com Google
async function handleGoogleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
        console.log('✅ Login Google bem-sucedido:', result.user);
        
    } catch (error) {
        console.error('❌ Erro no login Google:', error);
        alert('Erro ao fazer login com Google: ' + error.message);
    }
}

// Login com Apple
async function handleAppleLogin() {
    try {
        const provider = new firebase.auth.OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        
        const result = await auth.signInWithPopup(provider);
        console.log('✅ Login Apple bem-sucedido:', result.user);
        
    } catch (error) {
        console.error('❌ Erro no login Apple:', error);
        alert('Login com Apple ainda não disponível. Use Google ou entre em contato com suporte.');
    }
}

// Login com Email
function handleEmailLogin() {
    alert('Login com email será implementado em breve! Use Google para continuar.');
}

// Logout
async function handleLogout() {
    try {
        await auth.signOut();
        console.log('✅ Usuário deslogado');
    } catch (error) {
        console.error('❌ Erro no logout:', error);
    }
}

// Mostrar informações do usuário
function showUserInfo(user) {
    if (userName) userName.textContent = user.displayName || user.email;
    if (userAvatar) userAvatar.src = user.photoURL || 'https://via.placeholder.com/40';
    if (userInfo) userInfo.style.display = 'flex';
    if (loginBtn) loginBtn.style.display = 'none';
}

// Esconder informações do usuário
function hideUserInfo() {
    if (userInfo) userInfo.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'flex';
}

// Redirecionar para área do entregador
function redirectToEntregador() {
    window.location.href = 'entregador.html';
}

// Redirecionar para área admin
function redirectToAdmin() {
    window.location.href = 'admin.html';
}

// Envio do formulário de cadastro
async function handleCadastroSubmit(e) {
    e.preventDefault();
    
    if (!currentUser || !userToken) {
        alert('Você precisa estar logado para completar o cadastro.');
        return;
    }

    // Obter dados do formulário
    const formData = new FormData(cadastroForm);
    const possuiCnh = formData.get('possuiCnh');
    
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
        possuiCnh: possuiCnh === 'sim',
        cnh: possuiCnh === 'sim' ? formData.get('cnh') : null
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

    // Limpar dados
    dados.cpf = dados.cpf.replace(/\D/g, '');
    dados.telefone = dados.telefone.replace(/\D/g, '');
    dados.cep = dados.cep.replace(/\D/g, '');

    // Mostrar estado de carregamento
    btnSubmitCadastro.classList.add('loading');
    btnSubmitCadastro.disabled = true;
    btnSubmitCadastro.textContent = 'CADASTRANDO...';

    try {
        console.log('📤 Enviando dados para cadastro:', dados);

        const response = await fetch(`${BACKEND_URL}/cadastro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Cadastro realizado com sucesso! Aguarde a aprovação.');
            cadastroModal.style.display = 'none';
            redirectToEntregador();
        } else {
            throw new Error(result.message || 'Erro ao completar cadastro');
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar cadastro:', error);
        alert('❌ Erro ao completar cadastro: ' + error.message);
    } finally {
        btnSubmitCadastro.classList.remove('loading');
        btnSubmitCadastro.disabled = false;
        btnSubmitCadastro.textContent = 'COMPLETAR CADASTRO';
    }
}

// Máscaras para os campos
function aplicarMascaras() {
    // Máscara para CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
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
    }
    
    // Máscara para telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.substring(0, 11);
            
            if (value.length <= 11) {
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                value = value.replace(/(\d)(\d{4})$/, '$1-$2');
            }
            
            e.target.value = value;
        });
    }
    
    // Máscara para CEP
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 8) value = value.substring(0, 8);
            
            if (value.length > 5) {
                value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            }
            
            e.target.value = value;
        });
    }
}

// Validação de CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digito1 = resto >= 10 ? 0 : resto;
    
    if (digito1 !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digito2 = resto >= 10 ? 0 : resto;
    
    return digito2 === parseInt(cpf.charAt(10));
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