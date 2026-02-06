const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');

loginBouton.addEventListener('click', () => {
    const login = loginInput.value;
    const password = passwordInput.value;
    
    if (!login || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    fetch('/connexion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            login: login,  
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success !== false) {
            alert(data.message);    
            console.log(data.user.id);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userLogin', login);
            
            // Mettre à jour l'interface
            const toggleButton = document.getElementById('toggleLoginButton');
            const connectedUserBadge = document.getElementById('connectedUserBadge');
            const deconnectButton = document.getElementById('deconnectButton');
            
            document.getElementById('connectedUser').textContent = login;
            connectedUserBadge.style.display = 'inline-flex';
            toggleButton.style.display = 'none';
            
            // Fermer le dropdown et afficher le bouton de déconnexion
            document.getElementById('loginSection').style.display = 'none';
            deconnectButton.style.display = 'flex';
            
            // Vider les champs
            loginInput.value = '';
            passwordInput.value = '';
            
            // Afficher le planning hebdomadaire
            showWeeklyPlanningIfConnected();
            
            console.log(localStorage.getItem('userId'));
        } else {
            alert(data.message || 'Erreur de connexion');
        }
    })
    .catch(error => {
        console.error('Erreur lors de la connexion:', error);
        alert('Erreur lors de la connexion');
    });
}); 

registerButton.addEventListener('click', () => {
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            login: loginInput.value,  
            password: passwordInput.value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
        } else {
            alert(data.message || 'Erreur lors de l\'inscription');
        }
    })
    .catch(error => {
        console.error('Erreur lors de l\'inscription:', error);
        alert('Erreur lors de l\'inscription');
    });
});