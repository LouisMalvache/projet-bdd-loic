//variables globales
let customSelectedExercises = [];
let seancesSemaine = {
    lundi: null,
    mardi: null,
    mercredi: null,
    jeudi: null,
    vendredi: null,
    samedi: null,
    dimanche: null
};
let jourSelectionne = null;
let sectionPrincipale = 'accueil';

function afficherSection(section) {
    // Masquer toutes les sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => sec.classList.remove('active'));
    //masquer la section active
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        activeSection.classList.remove('active');
    }
    // Afficher la section sélectionnée
    const sectionToShow = document.getElementById(section);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = section;
    }


    //mettre a jour la navigation
    updateNavigation(section);

    // actions spécifiques à chaque section
    if (section === 'planification') {
        afficherPlanification();
    } else if (section === 'exercices') {
        afficherExercices();
    } else if (section === 'progression') {
        afficherProgression();
    } else if (section === 'profil') {
        afficherProfil();
    }
}

function updateNavigation(section) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.querySelector(`.nav-link[data-section="${section}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');

//inscription 
registerButton.addEventListener('click', () => {
    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            login: loginInput.value,
            password: passwordInput.value
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.success) {
            document.getElementById('loginInput').value = loginInput.value;
            document.getElementById('loginButton').click();
        } else {
            window.location.reload();
        }
    })
    .catch(error => {
        console.error('Erreur lors de l\'inscription:', error);
        alert('Erreur lors de l\'inscription');
    });
});

// Connexion
loginButton.addEventListener('click', () => {
    const login = loginInput.value;
    const password = passwordInput.value;

    if (!login || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    fetch('/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success !== false) {
            alert(data.message);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userLogin', login);

            // Mettre à jour l'interface
            updateAuthUI(login);

            // Fermer le dropdown
            document.getElementById('loginSection').style.display = 'none';

            // Vider les champs
            loginInput.value = '';
            passwordInput.value = '';

            // Actualiser les sections qui dépendent de l'authentification
            if (currentSection === 'profil') {
                initProfilePage();
            }
        } else {
            alert(data.message || 'Erreur de connexion');
        }
    })
    .catch(error => {
        console.error('Erreur lors de la connexion:', error);
        alert('Erreur lors de la connexion');
    });
});

// Déconnexion
function deconnecter() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userLogin');

    // Réinitialiser l'interface
    updateAuthUI(null);

    // Fermer le dropdown
    document.getElementById('loginSection').style.display = 'none';

    // Masquer les statistiques rapides
    document.getElementById('quick-stats').style.display = 'none';

    // Recharger la page pour réinitialiser complètement
    window.location.reload();
}

function updateAuthUI(login) {
    const toggleButton = document.getElementById('loginToggle');
    const connectedUserBadge = document.getElementById('connectedUserBadge');
    const connectedUser = document.getElementById('connectedUser');
    
    if (login) {
        connectedUser.textContent = login;
        connectedUserBadge.style.display = 'inline-flex';
        toggleButton.textContent = 'Mon compte';
    } else {
        connectedUser.textContent = '';
        connectedUserBadge.style.display = 'none';
        toggleButton.style.display = 'inline-flex';
        toggleButton.textContent = 'Connexion / Inscription';
    }
}
function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
}

// Vérifier si l'utilisateur est déjà connecté au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();

    const userId = localStorage.getItem('userId');
    const userLogin = localStorage.getItem('userLogin');
    
    if (userId && userLogin) {
        updateAuthUI(userLogin);
    }

    showSection('accueil');
});

function initNavigation() {
    const toggleButton = document.getElementById('toggleLoginButton');
    const loginSection = document.getElementById('loginSection');
    if (toggleButton && loginSection) {
        toggleButton.addEventListener('click', () => {
            loginSection.style.display = loginSection.style.display === 'none' ? 'block' : 'none';
        });
    document.addEventListener('click', function(event) {
        const isClickInside = loginSection.contains(event.target) ||
                            toggleButton.contains(event.target);
        if (!isClickInside && loginSection.style.display === 'block') {
            loginSection.style.display = 'none';
        }
    });
    }
}

function updateQuickStats() {
    const userId = localStorage.getItem('userId');
    const quickStats = document.getElementById('quick-stats');

    if (!userId) {
        quickStats.style.display = 'none';
        return;
    }

        fetch(`/weekly-plan/${userId}`)
        .then(response => response.json())
        .then(data => {
            let totalSessions = 0;
            let totalExercises = 0;
            const muscleGroups = new Set();

            Object.values(data).forEach(session => {
                if (session && session.exercises) {
                    totalSessions++;
                    totalExercises += session.exercises.length;
                    session.exercises.forEach(ex => muscleGroups.add(ex.muscle));
                }
            });

            // Mettre à jour l'affichage
            document.getElementById('total-sessions').textContent = totalSessions;
            document.getElementById('total-exercises').textContent = totalExercises;
            document.getElementById('muscle-groups').textContent = muscleGroups.size;

            quickStats.style.display = 'block';
        })
        .catch(error => {
            console.error('Erreur lors du chargement des statistiques:', error);
            quickStats.style.display = 'none';
        });
}


function initialiserSeancesSemaine() {
    const vueSemaine = document.getElementById('vue-semaine');
    const jours = document.getElementById('jours-semaine');
    const jourSelectionne = document.getElementById('jour-selectionne');
    const boutonModifier = document.getElementById('modifier-seance');
    const boutonQuitter = document.getElementById('quitter-modification');

    loadseancesSemaine();

    vueSemaine.addEventListener('click', (e) => {
        const jourCarte = e.target.closest('.jour-carte');
        if (jourCarte) {
            const jour = jourCarte.dataset.jour;
            selectedDay = jour;
            afficherSeance(jour);
        }
    });

    boutonModifier.addEventListener('click', () => {
        if (selectedDay) {
            afficherSection('exercices');
        }
    });