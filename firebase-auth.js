// ==========================================
// FIREBASE AUTHENTICATION + MULTI-LINGUA
// Pizzeria Grasso
// ==========================================

let currentUser = null;
let currentLang = 'it';
let userType = 'guest'; // 'guest' o 'registered'

// ==========================================
// INIZIALIZZAZIONE
// ==========================================

window.onload = function() {
    // Rileva lingua salvata o usa quella del browser
    const savedLang = localStorage.getItem('grasso_lang');
    if (savedLang) {
        currentLang = savedLang;
    } else {
        currentLang = detectLanguage();
    }
    
    // Carica traduzioni
    loadTranslations(currentLang);
    
    // Controlla se utente è già loggato
    checkAuthState();
    
    // Controlla tipo utente
    const savedUserType = localStorage.getItem('grasso_user_type');
    if (savedUserType) {
        userType = savedUserType;
    }
    
    // Mostra schermata benvenuto se necessario
    if (!userType || userType === 'none') {
        showWelcomeScreen();
    } else {
        hideWelcomeScreen();
    }
};

// ==========================================
// MULTI-LINGUA
// ==========================================

function detectLanguage() {
    const browserLang = navigator.language.slice(0, 2);
    const supported = ['it', 'en', 'de'];
    return supported.includes(browserLang) ? browserLang : 'it';
}

async function loadTranslations(lang) {
    try {
        const response = await fetch('traduzioni.json');
        const translations = await response.json();
        
        currentLang = lang;
        localStorage.setItem('grasso_lang', lang);
        
        // Applica traduzioni a tutti gli elementi con data-trad
        document.querySelectorAll('[data-trad]').forEach(el => {
            const key = el.getAttribute('data-trad');
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
        
        // Applica placeholder
        document.querySelectorAll('[data-trad-placeholder]').forEach(el => {
            const key = el.getAttribute('data-trad-placeholder');
            if (translations[lang] && translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });
        
    } catch (error) {
        console.error('Errore caricamento traduzioni:', error);
    }
}

function changeLanguage(lang) {
    loadTranslations(lang);
}

// ==========================================
// SCHERMATA BENVENUTO
// ==========================================

function showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }
}

function hideWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    }
}

function enterAsGuest() {
    userType = 'guest';
    localStorage.setItem('grasso_user_type', 'guest');
    hideWelcomeScreen();
    showToast('👻 Modalità Ospite attivata');
}

function showRegisterModal() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('authModal').classList.add('active');
    showLoginForm();
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    showWelcomeScreen();
}

// ==========================================
// AUTHENTICATION (Email/Password + Google)
// ==========================================

function checkAuthState() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            userType = 'registered';
            localStorage.setItem('grasso_user_type', 'registered');
            updateUIForLoggedInUser(user);
        } else {
            currentUser = null;
        }
    });
}

function updateUIForLoggedInUser(user) {
    // Aggiorna UI per mostrare nome utente
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.innerHTML = `
            <div class="user-info">
                <span>👤 ${user.displayName || user.email}</span>
                <button onclick="logout()" class="logout-btn">Esci</button>
            </div>
        `;
    }
}

// REGISTRAZIONE con Email/Password
async function registerWithEmail(email, password, name) {
    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Aggiorna profilo con nome
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Salva dati extra su Firebase Database
        await firebase.database().ref('users/' + userCredential.user.uid).set({
            name: name,
            email: email,
            phone: '',
            address: '',
            createdAt: Date.now(),
            totalOrders: 0,
            totalSpent: 0
        });
        
        showToast('✅ Registrazione completata!');
        closeAuthModal();
        hideWelcomeScreen();
        
    } catch (error) {
        console.error('Errore registrazione:', error);
        showToast('❌ ' + getAuthErrorMessage(error.code));
    }
}

// LOGIN con Email/Password
async function loginWithEmail(email, password) {
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        showToast('✅ Accesso effettuato!');
        closeAuthModal();
        hideWelcomeScreen();
    } catch (error) {
        console.error('Errore login:', error);
        showToast('❌ ' + getAuthErrorMessage(error.code));
    }
}

// LOGIN con Google
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        
        // Salva o aggiorna dati utente
        const user = result.user;
        await firebase.database().ref('users/' + user.uid).update({
            name: user.displayName,
            email: user.email,
            lastLogin: Date.now()
        });
        
        showToast('✅ Accesso con Google completato!');
        closeAuthModal();
        hideWelcomeScreen();
        
    } catch (error) {
        console.error('Errore Google login:', error);
        showToast('❌ ' + getAuthErrorMessage(error.code));
    }
}

// LOGOUT
async function logout() {
    try {
        await firebase.auth().signOut();
        userType = 'guest';
        localStorage.setItem('grasso_user_type', 'guest');
        showToast('👋 Arrivederci!');
        location.reload(); // Ricarica per tornare alla schermata iniziale
    } catch (error) {
        console.error('Errore logout:', error);
    }
}

// Recupera password
async function resetPassword(email) {
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        showToast('✅ Email di reset inviata!');
    } catch (error) {
        console.error('Errore reset password:', error);
        showToast('❌ ' + getAuthErrorMessage(error.code));
    }
}

// Messaggi di errore tradotti
function getAuthErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': 'Email già registrata',
        'auth/invalid-email': 'Email non valida',
        'auth/operation-not-allowed': 'Operazione non consentita',
        'auth/weak-password': 'Password troppo debole (minimo 6 caratteri)',
        'auth/user-disabled': 'Account disabilitato',
        'auth/user-not-found': 'Utente non trovato',
        'auth/wrong-password': 'Password errata',
        'auth/invalid-credential': 'Credenziali non valide'
    };
    return messages[errorCode] || 'Errore di autenticazione';
}

// ==========================================
// UTILS
// ==========================================

function showToast(message) {
    // Usa la funzione showToast esistente se c'è, altrimenti crea un alert
    if (typeof window.showToast === 'function') {
        window.showToast(message);
    } else {
        alert(message);
    }
}

// ==========================================
// FORM HANDLERS
// ==========================================

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

// ==========================================
// CHECK SE L'UTENTE È LOGGATO
// ==========================================

function isLoggedIn() {
    return currentUser !== null;
}

function isGuest() {
    return userType === 'guest';
}

function isRegistered() {
    return userType === 'registered';
}