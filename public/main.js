// ==========================================
// FITAPP - APPLICATION UNIFIÉE
// ==========================================

// Variables globales
let customSelectedExercises = [];
let weeklyPlan = {
    lundi: null, mardi: null, mercredi: null, jeudi: null,
    vendredi: null, samedi: null, dimanche: null
};
let selectedDay = null;
let currentSection = 'accueil';

// ==========================================
// GESTION DES SECTIONS
// ==========================================

function showSection(sectionName) {
    // Masquer toutes les sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    // Masquer la section active
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        activeSection.classList.remove('active');
    }

    // Afficher la section demandée
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
    }

    // Mettre à jour la navigation
    updateNavigation(sectionName);

    // Actions spécifiques selon la section
    switch(sectionName) {
        case 'planning':
            initWeeklyPlanning();
            break;
        case 'programme':
            initExerciseSelection();
            break;
        case 'profil':
            initProfilePage();
            break;
        case 'accueil':
            // Rien de spécial pour l'accueil
            break;
    }
}

function updateNavigation(activeSection) {
    // Mettre à jour les classes actives dans la navbar
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.querySelector(`[href="#${activeSection}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// ==========================================
// AUTHENTIFICATION
// ==========================================

const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');
const registerButton = document.getElementById('registerButton');
const loginButton = document.getElementById('loginButton');

// Inscription
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

function updateAuthUI(userLogin) {
    const toggleButton = document.getElementById('toggleLoginButton');
    const connectedUserBadge = document.getElementById('connectedUserBadge');
    const connectedUser = document.getElementById('connectedUser');

    if (userLogin) {
        connectedUser.textContent = userLogin;
        connectedUserBadge.style.display = 'inline-flex';
        toggleButton.style.display = 'none';
    } else {
        connectedUser.textContent = '';
        connectedUserBadge.style.display = 'none';
        toggleButton.style.display = 'inline-flex';
    }
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
}

// ==========================================
// INITIALISATION AU CHARGEMENT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser la navigation
    initNavigation();

    // Vérifier l'état de connexion
    const userId = localStorage.getItem('userId');
    const userLogin = localStorage.getItem('userLogin');

    if (userId && userLogin) {
        updateAuthUI(userLogin);
    }

    // Afficher la section d'accueil par défaut
    showSection('accueil');
});

function initNavigation() {
    // Toggle du dropdown de connexion
    const toggleButton = document.getElementById('toggleLoginButton');
    const loginSection = document.getElementById('loginSection');

    if (toggleButton && loginSection) {
        toggleButton.addEventListener('click', () => {
            loginSection.style.display = loginSection.style.display === 'none' ? 'block' : 'none';
        });

        // Fermer le dropdown si on clique en dehors
        document.addEventListener('click', function(event) {
            const isClickInside = loginSection.contains(event.target) ||
                                 toggleButton.contains(event.target);

            if (!isClickInside && loginSection.style.display === 'block') {
                loginSection.style.display = 'none';
            }
        });
    }
}

// ==========================================
// STATISTIQUES RAPIDES (ACCUEIL)
// ==========================================

function updateQuickStats() {
    const userId = localStorage.getItem('userId');
    const quickStats = document.getElementById('quick-stats');

    if (!userId) {
        quickStats.style.display = 'none';
        return;
    }

    // Charger les données du planning
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

// ==========================================
// PLANNING HEBDOMADAIRE
// ==========================================

function initWeeklyPlanning() {
    const weeklyOverview = document.getElementById('weekly-overview');
    const dayDetails = document.getElementById('day-details');
    const selectedDayTitle = document.getElementById('selected-day-title');
    const btnModifySession = document.getElementById('btn-modify-session');
    const btnCloseDay = document.getElementById('btn-close-day');

    // Charger le planning
    loadWeeklyPlan();

    // Gestion des clics sur les jours dans l'aperçu
    weeklyOverview.addEventListener('click', (e) => {
        const dayCard = e.target.closest('.weekly-day-card');
        if (dayCard) {
            const day = dayCard.dataset.day;
            selectedDay = day;
            displayDayDetails(day);
        }
    });

    btnModifySession.addEventListener('click', () => {
        // Aller à la section programme pour modifier
        showSection('programme');
    });

    btnCloseDay.addEventListener('click', () => {
        dayDetails.style.display = 'none';
        selectedDay = null;
    });
}

function displayDayDetails(day) {
    const dayDetails = document.getElementById('day-details');
    const selectedDayTitle = document.getElementById('selected-day-title');
    const savedSessionDisplay = document.getElementById('saved-session-display');

    selectedDayTitle.innerHTML = `<i class="fas fa-calendar-day"></i> Séance du ${capitalizeFirstLetter(day)}`;
    displaySavedSession(day);
    dayDetails.style.display = 'block';
}

function loadWeeklyPlan() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    fetch(`/weekly-plan/${userId}`)
        .then(response => response.json())
        .then(data => {
            weeklyPlan = {
                lundi: data.lundi || null,
                mardi: data.mardi || null,
                mercredi: data.mercredi || null,
                jeudi: data.jeudi || null,
                vendredi: data.vendredi || null,
                samedi: data.samedi || null,
                dimanche: data.dimanche || null
            };
            updateWeeklyOverview();
        })
        .catch(error => {
            console.error('Erreur lors du chargement du planning:', error);
            alert('Erreur lors du chargement du planning');
        });
}

function deleteSession(day) {
    if (confirm(`Voulez-vous vraiment supprimer la séance du ${day} ?`)) {
        const userId = localStorage.getItem('userId');

        fetch(`/delete-session/${userId}/${day}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                weeklyPlan[day] = null;
                displaySavedSession(day);
                updateWeeklyOverview();
            })
            .catch(error => {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression de la séance');
            });
    }
}

function displaySavedSession(day) {
    const savedSessionDisplay = document.getElementById('saved-session-display');
    const session = weeklyPlan[day];

    if (!session || !session.exercises || session.exercises.length === 0) {
        savedSessionDisplay.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Aucune séance enregistrée pour ce jour</p>
                <button onclick="showSection('programme')" class="btn-capture">
                    <i class="fas fa-plus"></i> Créer un programme
                </button>
            </div>
        `;
        return;
    }

    const grouped = session.exercises.reduce((acc, ex) => {
        if (!acc[ex.muscle]) acc[ex.muscle] = [];
        acc[ex.muscle].push(ex);
        return acc;
    }, {});

    let html = `
        <div class="session-preview">
            <h4><i class="fas fa-dumbbell"></i> ${session.exercises.length} exercice(s) programmé(s)</h4>
    `;

    Object.entries(grouped).forEach(([muscle, exercises]) => {
        html += `<div style="margin-top: 1rem;"><strong style="color: var(--primary-color);">${muscle}:</strong><br>`;
        exercises.forEach(ex => {
            html += `
                <div class="exercise-item">
                    <img src="${ex.image}" width="60" style="border-radius: 8px;">
                    <span>${ex.name}</span>
                </div>
            `;
        });
        html += `</div>`;
    });

    html += `
            <button class="btn-delete-session" onclick="deleteSession('${day}')">
                <i class="fas fa-trash"></i> Supprimer cette séance
            </button>
        </div>
    `;

    savedSessionDisplay.innerHTML = html;
}

function updateWeeklyOverview() {
    const overview = document.getElementById('weekly-overview');
    if (!overview) return;

    let html = '';
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const icons = {
        'lundi': 'fa-moon', 'mardi': 'fa-fire', 'mercredi': 'fa-star',
        'jeudi': 'fa-bolt', 'vendredi': 'fa-rocket', 'samedi': 'fa-sun', 'dimanche': 'fa-bed'
    };

    jours.forEach(jour => {
        const session = weeklyPlan[jour];
        const hasSession = session && session.exercises && session.exercises.length > 0;

        html += `
            <div class="weekly-day-card ${!hasSession ? 'rest-day' : ''}" data-day="${jour}">
                <div class="day-header">
                    <i class="fas ${icons[jour]}"></i>
                    <h4>${capitalizeFirstLetter(jour)}</h4>
                </div>
                ${hasSession ? 
                    `<p>${session.exercises.length} exercice(s)</p>
                     <div class="muscle-groups">
                         ${[...new Set(session.exercises.map(ex => ex.muscle))].join(', ')}
                     </div>` : 
                    '<p>Jour de repos</p>'}
            </div>
        `;
    });

    overview.innerHTML = html;
}

// ==========================================
// SÉLECTION D'EXERCICES
// ==========================================

function initExerciseSelection() {
    const exerciseSelection = document.getElementById("exercise-selection");
    const saveProgram = document.getElementById("save-program");

    if (!exerciseSelection || !saveProgram) return;

    const exercisesByMuscle = {
        "Épaules": [
            { name: "Développé militaire", image: "img/Le-Developpe-Militaire.gif" },
            { name: "Élévations frontales", image: "img/elevation-frontale.gif" },
            { name: "Élévations latérales", image: "img/elevation-laterale.gif" },
            { name: "Shrugs", image: "img/shrugs-avec-halteres.gif" },
            { name: "Développé épaules assis", image: "img/developpe-epaules-assis.gif" }
        ],
        "Biceps": [
            { name: "Curl pupitre barre EZ", image: "img/curl-au-pupitre-barre-ez-larry-scott.gif" },
            { name: "Curl pupitre machine", image: "img/curl-pupitre-machine.gif" },
            { name: "Curl marteau", image: "img/curl-marteau.gif" },
            { name: "Curl haltères incliné", image: "img/curl-haltere-incline.gif" },
            { name: "Curl concentration", image: "img/curl-concentre.gif" }
        ],
        "Triceps": [
            { name: "Barre au front", image: "img/barre-front.gif" },
            { name: "Extension corde haute", image: "img/extension-haute.gif" },
            { name: "Extension corde arrière", image: "img/extension-verticale-triceps-poulie-basse.gif" },
            { name: "Dips", image: "img/dips-triceps.gif" },
            { name: "Pompes", image: "img/pompe-musculation.gif" }
        ],
        "Avant-bras": [
            { name: "Avant-bras assis", image: "img/avant bras 1.gif" },
            { name: "Avant-bras debout", image: "img/avant bras 2.gif" }
        ],
        "Pectoraux": [
            { name: "Développé couché", image: "img/developpe-couche.gif" },
            { name: "Écarté incliné", image: "img/dev-incliné.gif" },
            { name: "Développé incliné haltères", image: "img/developpe-incline-halteres-exercice-musculation.gif" },
            { name: "Écarté poulie", image: "img/ecarte-poulie.gif" },
            { name: "Pompes inclinées", image: "img/pompes-incline.gif" },
            { name: "Pompes déclinées", image: "img/pompe-declinee.gif" }
        ],
        "Dos": [
            { name: "Traction", image: "img/traction-musculation-dos.gif" },
            { name: "Tirage horizontal", image: "img/tirage-horizontal-poulie.gif" },
            { name: "Tirage vertical", image: "img/tirage-vertical-poitrine.gif" },
            { name: "Rowing barre", image: "img/rowing-barre.gif" },
            { name: "Soulevé de terre", image: "img/souleve-de-terre-avec-deficit.gif" },
            { name: "extension lombaires", image: "img/extension-lombaires.gif" }
        ],
        "Abdominaux": [
            { name: "Relevé de genoux suspendu", image: "img/releve-de-genoux-suspendu-exercice-musculation.gif" },
            { name: "Planche", image: "img/planche-abdos.gif" },
            { name: "Crunch", image: "img/crunch.gif" },
            { name: "Mountain climber", image: "img/mountain-climber.gif" },
            { name: "Planche inversée", image: "img/planche-inversee.gif" }
        ],
        "Jambes": [
            { name: "Squat", image: "img/squat.gif" },
            { name: "Presse à cuisses", image: "img/presse-a-cuisses-inclinee.gif" },
            { name: "Leg extension", image: "img/leg-extension.gif" },
            { name: "leg-curl-allonge", image: "img/leg-curl-allonge.gif" },
            { name: "Fentes avant", image: "img/fentes-avant-kettlebell.gif" },
            { name: "Squat sauté", image: "img/squat-saute.gif" }
        ]
    };

    const container = document.getElementById("exercises-container");
    const counterText = document.getElementById("counter-text");
    const counterBox = document.getElementById("exercise-counter");
    const btnReset = document.getElementById("btn-reset");
    const btnSaveProgram = document.getElementById("btn-save-program");
    const btnBackSelection = document.getElementById("btn-back-selection");
    const saveDayButtons = document.getElementById("save-day-buttons");
    const btnValidate = document.getElementById("btn-validate");

    let selectedDayForSave = null;

    function renderExercises() {
        container.innerHTML = "";
        Object.entries(exercisesByMuscle).forEach(([muscle, exercises]) => {
            const section = document.createElement("section");
            section.innerHTML = `<h3>${muscle}</h3>`;

            const grid = document.createElement("div");
            grid.className = "d-flex flex-wrap justify-content-center";

            exercises.forEach(ex => {
                const selected = customSelectedExercises.some(sel => sel.name === ex.name);
                const card = document.createElement("div");
                card.className = `card m-2 p-2 exercise-card ${selected ? "border border-warning" : ""}`;
                card.style.width = "180px";
                card.style.cursor = "pointer";
                card.innerHTML = `
                    <img src="${ex.image}" class="card-img-top" alt="${ex.name}">
                    <div class="card-body text-center"><p>${ex.name}</p></div>
                `;
                card.addEventListener("click", () => toggleExercise(ex, muscle));
                grid.appendChild(card);
            });

            section.appendChild(grid);
            container.appendChild(section);
        });
    }

    function toggleExercise(ex, muscle) {
        const index = customSelectedExercises.findIndex(e => e.name === ex.name);
        if (index >= 0) {
            customSelectedExercises.splice(index, 1);
        } else {
            customSelectedExercises.push({ ...ex, muscle });
        }
        updateUI();
    }

    function updateUI() {
        counterText.textContent = `${customSelectedExercises.length} exercice${customSelectedExercises.length > 1 ? "s" : ""} sélectionné${customSelectedExercises.length > 1 ? "s" : ""}`;
        counterBox.style.display = customSelectedExercises.length ? "block" : "none";
        btnReset.style.display = customSelectedExercises.length ? "inline-block" : "none";

        if (customSelectedExercises.length > 0) {
            document.getElementById("btn-validate").style.display = "inline-block";
        } else {
            document.getElementById("btn-validate").style.display = "none";
        }
    }

    // Bouton pour aller à la sauvegarde
    btnValidate.addEventListener("click", () => {
        if (customSelectedExercises.length === 0) return;
        exerciseSelection.style.display = "none";
        saveProgram.style.display = "block";
    });

    btnReset.addEventListener("click", resetSelection);

    function resetSelection() {
        if (confirm("Supprimer toutes les sélections ?")) {
            customSelectedExercises = [];
            updateUI();
        }
    }

    // Gestion des jours pour sauvegarde
    saveDayButtons.addEventListener("click", (e) => {
        if (e.target.closest(".day-btn")) {
            const btn = e.target.closest(".day-btn");
            saveDayButtons.querySelectorAll(".day-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedDayForSave = btn.dataset.day;
            btnSaveProgram.disabled = false;
        }
    });

    btnSaveProgram.addEventListener("click", () => {
        if (!selectedDayForSave || customSelectedExercises.length === 0) return;

        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Vous devez être connecté pour enregistrer un planning');
            return;
        }

        fetch('/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                day: selectedDayForSave,
                exercises: customSelectedExercises
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(`Programme enregistré pour le ${selectedDayForSave} !`);
            customSelectedExercises = [];
            selectedDayForSave = null;
            saveProgram.style.display = "none";
            exerciseSelection.style.display = "block";
            updateUI();
            loadWeeklyPlan(); // Recharger le planning
        })
        .catch(error => {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde du programme');
        });
    });

    btnBackSelection.addEventListener("click", () => {
        saveProgram.style.display = "none";
        exerciseSelection.style.display = "block";
        selectedDayForSave = null;
        saveDayButtons.querySelectorAll(".day-btn").forEach(b => b.classList.remove("active"));
        btnSaveProgram.disabled = true;
    });

    renderExercises();
}

// ==========================================
// PAGE PROFIL
// ==========================================

function initProfilePage() {
    const userId = localStorage.getItem('userId');
    const userLogin = localStorage.getItem('userLogin');

    const notConnectedMessage = document.getElementById('not-connected-message');
    const profileContent = document.getElementById('profile-content');

    if (!userId || !userLogin) {
        notConnectedMessage.style.display = 'block';
        profileContent.style.display = 'none';
        return;
    }

    notConnectedMessage.style.display = 'none';
    profileContent.style.display = 'block';

    // Mettre à jour les informations du profil
    document.getElementById('profile-username').textContent = userLogin;
    document.getElementById('profile-member-since').textContent = new Date().toLocaleDateString('fr-FR');

    // Charger le planning hebdomadaire pour le profil
    loadWeeklyScheduleForProfile();
}

function loadWeeklyScheduleForProfile() {
    const userId = localStorage.getItem('userId');
    const container = document.getElementById('profile-weekly-schedule');

    if (!userId || !container) return;

    fetch(`/weekly-plan/${userId}`)
        .then(response => response.json())
        .then(data => {
            let html = '';

            if (Object.values(data).every(session => !session || !session.exercises || session.exercises.length === 0)) {
                html = '<p class="text-muted">Aucun planning défini cette semaine</p>';
            } else {
                const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
                const icons = {
                    'lundi': 'fa-moon', 'mardi': 'fa-fire', 'mercredi': 'fa-star',
                    'jeudi': 'fa-bolt', 'vendredi': 'fa-rocket', 'samedi': 'fa-sun', 'dimanche': 'fa-bed'
                };

                jours.forEach(jour => {
                    const session = data[jour];
                    const hasSession = session && session.exercises && session.exercises.length > 0;

                    html += `
                        <div class="profile-day-item ${hasSession ? 'has-session' : 'rest-day'}">
                            <div class="day-icon">
                                <i class="fas ${icons[jour]}"></i>
                            </div>
                            <div class="day-info">
                                <strong>${capitalizeFirstLetter(jour)}</strong>
                                ${hasSession ? `<br><small>${session.exercises.length} exercice(s)</small>` : '<br><small>Jour de repos</small>'}
                            </div>
                        </div>
                    `;
                });
            }

            container.innerHTML = html;
        })
        .catch(error => {
            console.error('Erreur lors du chargement du planning:', error);
            container.innerHTML = '<p class="text-danger">Erreur de chargement</p>';
        });
}

function loadMuscleGroupsStats() {
    const userId = localStorage.getItem('userId');
    const container = document.getElementById('muscle-groups-chart');

    if (!userId || !container) return;

    fetch(`/weekly-plan/${userId}`)
        .then(response => response.json())
        .then(data => {
            const muscleStats = {};

            // Compter les exercices par groupe musculaire
            Object.values(data).forEach(session => {
                if (session && session.exercises) {
                    session.exercises.forEach(ex => {
                        muscleStats[ex.muscle] = (muscleStats[ex.muscle] || 0) + 1;
                    });
                }
            });

            if (Object.keys(muscleStats).length === 0) {
                container.innerHTML = '<p class="text-muted">Aucun exercice programmé</p>';
                return;
            }

            let html = '';
            Object.entries(muscleStats).forEach(([muscle, count]) => {
                const percentage = Math.round((count / Object.values(muscleStats).reduce((a, b) => a + b, 0)) * 100);
                html += `
                    <div class="muscle-group-item">
                        <div class="muscle-info">
                            <span class="muscle-name">${muscle}</span>
                            <span class="muscle-count">${count} ex.</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        })
        .catch(error => {
            console.error('Erreur lors du chargement des statistiques:', error);
            container.innerHTML = '<p class="text-danger">Erreur de chargement</p>';
        });
}

function loadSessionHistory() {
    const userId = localStorage.getItem('userId');
    const container = document.getElementById('session-history');

    if (!userId || !container) return;

    // Pour l'instant, on simule un historique simple
    // Dans une vraie application, cela viendrait du serveur
    container.innerHTML = `
        <div class="history-item">
            <i class="fas fa-clock"></i>
            <div class="history-content">
                <strong>Dernière connexion</strong>
                <small>${new Date().toLocaleString('fr-FR')}</small>
            </div>
        </div>
        <div class="history-item">
            <i class="fas fa-plus-circle"></i>
            <div class="history-content">
                <strong>Programme créé</strong>
                <small>Il y a 2 jours</small>
            </div>
        </div>
        <div class="history-item">
            <i class="fas fa-calendar-check"></i>
            <div class="history-content">
                <strong>Planning mis à jour</strong>
                <small>Il y a 1 semaine</small>
            </div>
        </div>
    `;
}

// ==========================================
// UTILITAIRES
// ==========================================

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}