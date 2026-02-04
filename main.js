const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');
const registerBouton = document.getElementById('registerButton');
const loginBouton = document.getElementById('loginButton');

// VARIABLES GLOBALES
let customSelectedExercises = [];
let weeklyPlan = {
    lundi: null,
    mardi: null,
    mercredi: null,
    jeudi: null,
    vendredi: null,
    samedi: null,
    dimanche: null
};
let selectedDay = null;

// Toggle pour afficher/masquer la section de connexion
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleLoginButton');
    const loginSection = document.getElementById('loginSection');
    
    if (toggleButton && loginSection) {
        toggleButton.addEventListener('click', () => {
            if (loginSection.style.display === 'none') {
                loginSection.style.display = 'block';
                toggleButton.innerHTML = '<i class="fas fa-times"></i> Fermer';
            } else {
                loginSection.style.display = 'none';
                toggleButton.innerHTML = '<i class="fas fa-user"></i> Connexion / Inscription';
            }
        });
    }
    
    // Initialiser le planning au chargement
    initWeeklyPlanning();
    
    // Initialiser la sélection d'exercices
    initExerciseSelection();
});

// INSCRIPTION
registerBouton.addEventListener('click', () => {
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
        alert(data.message);
        window.location.reload();
    });
});

// CONNEXION
const loginButton = document.getElementById('loginButton');
loginButton.addEventListener('click', () => {
    const loginInput = document.getElementById('loginInput').value;
    const passwordInput = document.getElementById('passwordInput').value;
    
    fetch('/connexion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            login: loginInput,  
            password: passwordInput
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);    
        console.log(data.user.id);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userLogin', loginInput);
        
        // Afficher le planning hebdomadaire
        showWeeklyPlanningIfConnected();
        
        // Afficher les infos utilisateur
        document.getElementById('connectedUser').textContent = loginInput;
        
        console.log(localStorage.getItem('userId'));
    });
}); 

function deconnecter() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userLogin');
    document.getElementById('connectedUser').textContent = 'Aucun';
    
    // Masquer le planning
    const weeklyPlanningSection = document.getElementById('weekly-planning-section');
    if (weeklyPlanningSection) {
        weeklyPlanningSection.style.display = 'none';
    }
    
    alert('Vous êtes déconnecté');
    window.location.reload(); 
}

// ==========================================
// SYSTÈME DE PLANNING HEBDOMADAIRE
// ==========================================

function initWeeklyPlanning() {
    const dayButtons = document.querySelectorAll('.day-btn');
    const daySessionContainer = document.getElementById('day-session-container');
    const selectedDayTitle = document.getElementById('selected-day-title');
    const btnAssignSession = document.getElementById('btn-assign-session');

    // Charger le planning depuis le serveur
    loadWeeklyPlan();

    // Gestion des clics sur les jours
    dayButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            dayButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDay = btn.dataset.day;
            daySessionContainer.style.display = 'block';
            selectedDayTitle.innerHTML = `<i class="fas fa-calendar-day"></i> Séance du ${capitalizeFirstLetter(selectedDay)}`;
            displaySavedSession(selectedDay);
        });
    });

    // Enregistrer le programme actuel pour le jour sélectionné
    if (btnAssignSession) {
        btnAssignSession.addEventListener('click', () => {
            if (!selectedDay) {
                alert('Veuillez sélectionner un jour de la semaine');
                return;
            }

            if (customSelectedExercises.length === 0) {
                alert('Veuillez créer un programme avec des exercices avant de l\'enregistrer');
                return;
            }

            const userId = localStorage.getItem('userId');
            if (!userId) {
                alert('Vous devez être connecté pour enregistrer un planning');
                return;
            }

            // Sauvegarder directement sur le serveur
            fetch('/save-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    day: selectedDay,
                    exercises: customSelectedExercises
                })
            })
            .then(response => response.json())
            .then(data => {
                alert(`Séance enregistrée pour le ${selectedDay} !`);
                // Recharger le planning
                loadWeeklyPlan();
            })
            .catch(error => {
                console.error('Erreur lors de la sauvegarde:', error);
                alert('Erreur lors de la sauvegarde de la séance');
            });
        });
    }

    updateWeeklyOverview();
}

// Charger le planning depuis le serveur
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
            console.log('Planning chargé depuis le serveur:', weeklyPlan);
        })
        .catch(error => {
            console.error('Erreur lors du chargement du planning:', error);
        });
}

// Supprimer une séance du serveur
function deleteSession(day) {
    if (confirm(`Voulez-vous vraiment supprimer la séance du ${day} ?`)) {
        const userId = localStorage.getItem('userId');
        
        fetch(`/delete-session/${userId}/${day}`, {
            method: 'DELETE'
        })
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

// Afficher la séance enregistrée pour un jour
function displaySavedSession(day) {
    const savedSessionDisplay = document.getElementById('saved-session-display');
    const session = weeklyPlan[day];

    if (!session || !session.exercises || session.exercises.length === 0) {
        savedSessionDisplay.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Aucune séance enregistrée pour ce jour</p>
            </div>
        `;
        return;
    }

    // Grouper les exercices par muscle
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

// Mettre à jour la vue d'ensemble hebdomadaire
function updateWeeklyOverview() {
    const overview = document.getElementById('weekly-overview');
    if (!overview) return;

    let html = '';
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const icons = {
        'lundi': 'fa-moon',
        'mardi': 'fa-fire',
        'mercredi': 'fa-star',
        'jeudi': 'fa-bolt',
        'vendredi': 'fa-rocket',
        'samedi': 'fa-sun',
        'dimanche': 'fa-bed'
    };

    jours.forEach(jour => {
        const session = weeklyPlan[jour];
        const hasSession = session && session.exercises && session.exercises.length > 0;

        html += `
            <div class="weekly-day-card ${!hasSession ? 'rest-day' : ''}">
                <h4>
                    <i class="fas ${icons[jour]}"></i> ${capitalizeFirstLetter(jour)}
                    ${hasSession ? `<span style="color: var(--text-light); font-size: 0.9rem; font-weight: normal;">(${session.exercises.length} exercices)</span>` : ''}
                </h4>
        `;

        if (hasSession) {
            const muscleGroups = [...new Set(session.exercises.map(ex => ex.muscle))];
            html += `<p style="color: var(--text-muted);">Groupes musculaires : ${muscleGroups.join(', ')}</p>`;
        } else {
            html += `<p style="color: var(--text-muted);"><i class="fas fa-spa"></i> Jour de repos</p>`;
        }

        html += `</div>`;
    });

    overview.innerHTML = html;
}

// Fonction utilitaire pour capitaliser la première lettre
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Afficher le planning quand l'utilisateur est connecté
function showWeeklyPlanningIfConnected() {
    const userId = localStorage.getItem('userId');
    const weeklyPlanningSection = document.getElementById('weekly-planning-section');
    
    if (userId && weeklyPlanningSection) {
        weeklyPlanningSection.style.display = 'block';
        loadWeeklyPlan();
    }
}

// ==========================================
// SÉLECTION D'EXERCICES
// ==========================================

function initExerciseSelection() {
    const selectionMode = document.getElementById("selection-mode");
    const programMode = document.getElementById("program-mode");

    if (!selectionMode || !programMode) return;

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
    const btnValidate = document.getElementById("btn-validate");
    const btnReset = document.getElementById("btn-reset");
    const programDetails = document.getElementById("program-details");
    const programCount = document.getElementById("program-exercise-count");
    const btnEdit = document.getElementById("btn-edit");
    const btnResetProgram = document.getElementById("btn-reset-program");

    function renderExercises() {
        container.innerHTML = "";
        Object.entries(exercisesByMuscle).forEach(([muscle, exercises]) => {
            const section = document.createElement("section");
            section.innerHTML = `<h2>${muscle}</h2>`;

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
        btnValidate.disabled = customSelectedExercises.length === 0;
        btnValidate.style.opacity = customSelectedExercises.length === 0 ? "0.5" : "1";
        renderExercises();
    }

    function renderProgram() {
        programDetails.innerHTML = "";
        const grouped = customSelectedExercises.reduce((acc, ex) => {
            if (!acc[ex.muscle]) acc[ex.muscle] = [];
            acc[ex.muscle].push(ex);
            return acc;
        }, {});

        const durationExercises = ["Planche", "Planche inversée", "Mountain climber"];

        Object.entries(grouped).forEach(([muscle, exercises]) => {
            const div = document.createElement("div");
            div.className = "mb-4";
            div.innerHTML = `<h3 class="text-warning">${muscle}</h3>`;

            exercises.forEach(ex => {
                const isDuration = durationExercises.some(name => 
                    ex.name.toLowerCase().includes(name.toLowerCase())
                );
                
                const repsInfo = isDuration 
                    ? "2-3 séries de 30-60 secondes" 
                    : "3-4 séries de 8-12 reps";

                const item = document.createElement("div");
                item.className = "d-flex align-items-center mb-2 bg-dark p-2 rounded";
                item.innerHTML = `
                    <img src="${ex.image}" width="80" class="me-3 rounded">
                    <div><strong>${ex.name}</strong><br><small>${repsInfo}</small></div>
                    <button class="btn btn-sm btn-outline-danger ms-auto"><i class="fas fa-trash"></i></button>
                `;
                item.querySelector("button").addEventListener("click", () => {
                    customSelectedExercises = customSelectedExercises.filter(e => e.name !== ex.name);
                    renderProgram();
                });
                div.appendChild(item);
            });
            programDetails.appendChild(div);
        });
    }

    btnValidate.addEventListener("click", () => {
        if (customSelectedExercises.length === 0) return;
        selectionMode.style.display = "none";
        programMode.style.display = "block";
        programCount.textContent = `Programme créé avec ${customSelectedExercises.length} exercice${customSelectedExercises.length > 1 ? "s" : ""}`;
        renderProgram();
    });

    btnReset.addEventListener("click", resetAll);
    btnResetProgram.addEventListener("click", resetAll);

    function resetAll() {
        if (confirm("Supprimer toutes les sélections ?")) {
            customSelectedExercises = [];
            selectionMode.style.display = "block";
            programMode.style.display = "none";
            updateUI();
        }
    }

    btnEdit.addEventListener("click", () => {
        selectionMode.style.display = "block";
        programMode.style.display = "none";
        updateUI();
    });

    renderExercises();
}