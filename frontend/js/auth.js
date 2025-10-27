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

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
let userProfile = null;

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initEventListeners();
    aplicarMascaras();
});

// Inicializar autenticação
function initAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserProfile(user.uid);
            showUserInfo(user);
            checkUserRegistration(user.uid);
        } else {
            currentUser = null;
            userProfile = null;
            hideUserInfo();
        }
    });
}

// Carregar perfil do usuário
async function loadUserProfile(uid) {
    try {
        const doc = await db.collection('entregadores').doc(uid).get();
        if (doc.exists) {
            userProfile = doc.data();
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

// Verificar se usuário já completou cadastro
async function checkUserRegistration(uid) {
    try {
        const doc = await db.collection('entregadores').doc(uid).get();
        if (!doc.exists) {
            // Usuário não completou cadastro
            showCadastroModal();
        } else {
            // Usuário já cadastrado, redirecionar para dashboard
            redirectToDashboard();
        }
    } catch (error) {
        console.error('Erro ao verificar cadastro:', error);
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
        console.log('Login Google bem-sucedido:', result.user);
        
    } catch (error) {
        console.error('Erro no login Google:', error);
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
        console.log('Login Apple bem-sucedido:', result.user);
        
    } catch (error) {
        console.error('Erro no login Apple:', error);
        alert('Erro ao fazer login com Apple: ' + error.message);
    }
}

// Login com Email (simplificado - poderia ser expandido)
function handleEmailLogin() {
    alert('Login com email será implementado em breve!');
    // Aqui poderia abrir outro modal para email/senha
}

// Logout
async function handleLogout() {
    try {
        await auth.signOut();
        console.log('Usuário deslogado');
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// Mostrar informações do usuário
function showUserInfo(user) {
    userName.textContent = user.displayName || user.email;
    userAvatar.src = user.photoURL || '/img/default-avatar.png';
    userInfo.style.display = 'flex';
    loginBtn.style.display = 'none';
}

// Esconder informações do usuário
function hideUserInfo() {
    userInfo.style.display = 'none';
    loginBtn.style.display = 'flex';
}

// Redirecionar para dashboard
function redirectToDashboard() {
    // Em uma implementação real, isso redirecionaria para outra página
    console.log('Redirecionando para dashboard...');
    // window.location.href = 'dashboard.html';
}

// Envio do formulário de cadastro
async function handleCadastroSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Você precisa estar logado para completar o cadastro.');
        return;
    }

    // Obter dados do formulário
    const formData = new FormData(cadastroForm);
    const dados = {
        // Dados pessoais
        nome: formData.get('nome'),
        cpf: formData.get('cpf'),
        telefone: formData.get('telefone'),
        dataNascimento: formData.get('dataNascimento'),
        
        // Endereço
        endereco: formData.get('endereco'),
        cidade: formData.get('cidade'),
        estado: formData.get('estado'),
        cep: formData.get('cep'),
        
        // Veículo e disponibilidade
        veiculo: formData.get('veiculo'),
        placa: formData.get('placa'),
        disponibilidade: formData.get('disponibilidade'),
        
        // Documentos
        cnh: formData.get('cnh'),
        categoriaCnh: formData.get('categoriaCnh'),
        
        // Metadados
        userId: currentUser.uid,
        email: currentUser.email,
        dataCadastro: new Date().toISOString(),
        status: 'pendente',
        verificado: false
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

    try {
        // Salvar no Firestore
        await db.collection('entregadores').doc(currentUser.uid).set(dados);
        
        console.log('✅ Cadastro realizado com sucesso:', dados);
        alert('Cadastro realizado com sucesso! Aguarde a aprovação.');
        
        cadastroModal.style.display = 'none';
        redirectToDashboard();
        
    } catch (error) {
        console.error('❌ Erro ao salvar cadastro:', error);
        alert('Erro ao completar cadastro: ' + error.message);
    } finally {
        btnSubmitCadastro.classList.remove('loading');
        btnSubmitCadastro.disabled = false;
    }
}

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

    // Máscara para placa (formato Mercosul)
    const placaInput = document.getElementById('placa');
    placaInput.addEventListener('input', function(e) {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 7) value = value.substring(0, 7);
        
        if (value.length > 3) {
            value = value.replace(/([A-Z0-9]{3})([A-Z0-9])/, '$1-$2');
        }
        
        e.target.value = value;
    });
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