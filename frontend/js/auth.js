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

// Backend URL - ATUALIZE COM SUA URL DO RAILWAY
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

// Novos elementos de navegação
const navButtons = document.getElementById('nav-buttons');
const btnPedidos = document.getElementById('btn-pedidos');
const btnAdmin = document.getElementById('btn-admin');
const btnCriarPedido = document.getElementById('btn-criar-pedido');

// Estado da aplicação
let currentUser = null;
let userToken = null;
let userRole = 'entregador';
let userProfile = null;

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
            updateNavigationButtons();
        } else {
            currentUser = null;
            userToken = null;
            userRole = 'entregador';
            userProfile = null;
            hideUserInfo();
            hideNavigationButtons();
        }
    });
}

// Registrar usuário no backend após login social
async function registerUserInBackend(user) {
    try {
        console.log('📝 Registrando usuário no backend...');
        
        const response = await fetch(`${BACKEND_URL}/register-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                role: 'entregador'
            })
        });

        if (response.ok) {
            const result = await response.json();
            userRole = result.user.role;
            console.log('✅ Usuário registrado no backend. Role:', userRole);
            return result.user;
        } else {
            console.warn('⚠️ Erro ao registrar usuário, usando role padrão');
        }
    } catch (error) {
        console.error('❌ Erro ao conectar com backend:', error);
        // Continua com role padrão mesmo com erro
    }
}

// Verificar se usuário já tem perfil completo
async function checkUserProfile() {
    if (!currentUser || !userToken) return;

    try {
        // Tentar verificar se é admin primeiro
        const adminTest = await fetch(`${BACKEND_URL}/entregadores`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        if (adminTest.ok) {
            // Se conseguiu acessar a rota admin, é admin
            userRole = 'admin';
            console.log('✅ Usuário é ADMIN');
            return;
        }
    } catch (error) {
        // Não é admin ou erro de conexão
        console.log('👤 Usuário é ENTREGADOR ou erro de verificação');
    }

    // Se não é admin, verificar se já tem cadastro de entregador
    try {
        const response = await fetch(`${BACKEND_URL}/entregadores`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            const userEntregador = result.data ? result.data.find(e => e.userId === currentUser.uid) : null;
            
            if (!userEntregador) {
                console.log('📝 Usuário precisa completar cadastro');
                showCadastroModal();
            } else {
                userProfile = userEntregador;
                console.log('✅ Perfil de entregador encontrado');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao verificar perfil:', error);
    }
}

// Atualizar botões de navegação baseado no role
function updateNavigationButtons() {
    if (!currentUser) {
        hideNavigationButtons();
        return;
    }

    // Mostrar área de navegação
    navButtons.style.display = 'flex';
    
    // Botão de Pedidos (visível para todos os usuários logados)
    btnPedidos.style.display = 'inline-block';
    
    // Botões de Admin (apenas para admins)
    if (userRole === 'admin') {
        btnAdmin.style.display = 'inline-block';
        btnCriarPedido.style.display = 'inline-block';
        console.log('👑 Botões de admin mostrados');
    } else {
        btnAdmin.style.display = 'none';
        btnCriarPedido.style.display = 'none';
        console.log('📦 Apenas botão de pedidos mostrado');
    }
}

// Esconder botões de navegação
function hideNavigationButtons() {
    navButtons.style.display = 'none';
    btnPedidos.style.display = 'none';
    btnAdmin.style.display = 'none';
    btnCriarPedido.style.display = 'none';
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

    // Botões de navegação
    btnPedidos.addEventListener('click', () => {
        if (userRole === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'entregador.html';
        }
    });

    btnAdmin.addEventListener('click', () => {
        window.location.href = 'admin.html';
    });

    btnCriarPedido.addEventListener('click', () => {
        window.location.href = 'admin.html#criar-pedido';
    });
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
            userProfile = result.entregador;
            updateNavigationButtons();
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

// Função para criar admin (executar no console quando necessário)
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
    .then(response => response.json())
    .then(data => {
        console.log('✅ Admin criado:', data);
        alert('Admin criado com sucesso! Recarregue a página.');
        location.reload();
    })
    .catch(error => {
        console.error('❌ Erro ao criar admin:', error);
        alert('Erro ao criar admin: ' + error.message);
    });
};