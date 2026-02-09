// ==========================================
// FITAPP - APPLICATION DE MUSCULATION
// ==========================================

// Variables globales (données de l'app)
let mesExercicesChoisis = [];
let monPlanningHebdo = {
    lundi: null, mardi: null, mercredi: null, jeudi: null,
    vendredi: null, samedi: null, dimanche: null
};
let jourSelectionne = null;
let sectionActive = 'accueil';

// ==========================================
// GESTION DES PAGES DE L'APPLICATION
// ==========================================

// Fonction pour afficher une page de l'app
function afficherSection(nomSection) {
    // On cache toutes les sections (pages)
    const toutesLesSections = document.querySelectorAll('.content-section');
    toutesLesSections.forEach(section => section.classList.remove('active'));

    // On cache la section qui était affichée avant
    const sectActuelle = document.querySelector('.content-section.active');
    if (sectActuelle) {
        sectActuelle.classList.remove('active');
    }

    // On affiche la nouvelle section
    const nouvellePage = document.getElementById(nomSection + '-section');
    if (nouvellePage) {
        nouvellePage.classList.add('active');
        sectionActive = nomSection;
    }

    // On met à jour le menu de navigation
    mettreAJourNavigation(nomSection);

    // On lance les fonctions spéciales selon la page
    switch(nomSection) {
        case 'planning':
            initialiserPlanningHebdo();
            break;
        case 'programme':
            initialiserSelectionExercices();
            break;
        case 'profil':
            initialiserPageProfil();
            break;
        case 'accueil':
            // Rien de spécial pour l'accueil
            break;
    }
}


// Fonction pour mettre à jour le menu (navbar)
function mettreAJourNavigation(sectionActive) {
    // On enlève la classe "active" de tous les boutons du menu
    const boutons = document.querySelectorAll('.navbar-nav .nav-link');
    boutons.forEach(btn => btn.classList.remove('active'));

    // On ajoute la classe "active" au bouton qui correspond à la page actuelle
    const boutonActif = document.querySelector(`[href="#${sectionActive}"]`);
    if (boutonActif) {
        boutonActif.classList.add('active');
    }
}

// ==========================================
// GESTION DE LA CONNEXION / INSCRIPTION
// ==========================================

// Fonction pour initialiser les boutons de connexion
function initialiserBoutonsConnexion() {
    const champNom = document.getElementById('loginInput');
    const champMotDePasse = document.getElementById('passwordInput');
    const boutonInscrire = document.getElementById('registerButton');
    const boutonConnecter = document.getElementById('loginButton');

    if (!champNom || !champMotDePasse || !boutonInscrire || !boutonConnecter) {
        console.error('Erreur : éléments de connexion non trouvés');
        return;
    }

    // Bouton d'inscription
    boutonInscrire.addEventListener('click', () => {
        // On envoie les données au serveur pour créer un compte
        fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: champNom.value,
                password: champMotDePasse.value
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            if (data.success) {
                // Si l'inscription réussit, on se connecte automatiquement
                document.getElementById('loginInput').value = champNom.value;
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

    // Bouton de connexion
    boutonConnecter.addEventListener('click', () => {
        const nom = champNom.value;
        const motDePasse = champMotDePasse.value;

        // On vérifie que les deux champs sont remplis
        if (!nom || !motDePasse) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        // On envoie les données au serveur pour se connecter
        fetch('/connexion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: nom, password: motDePasse })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success !== false) {
                alert(data.message);
                // On sauvegarde l'ID de l'utilisateur et son nom
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userLogin', nom);

                // On met à jour l'interface
                mettreAJourInterfaceConnexion(nom);

                // On ferme la boîte de connexion
                document.getElementById('loginSection').style.display = 'none';

                // On vide les champs
                champNom.value = '';
                champMotDePasse.value = '';

                // On recharge la page profil si elle est affichée
                if (sectionActive === 'profil') {
                    initialiserPageProfil();
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
}

// Bouton de déconnexion
function seDeconnecter() {
    // On supprime les données de l'utilisateur
    localStorage.removeItem('userId');
    localStorage.removeItem('userLogin');

    // On met à jour l'interface
    mettreAJourInterfaceConnexion(null);

    // On ferme la boîte de connexion
    document.getElementById('loginSection').style.display = 'none';

    // On cache les statistiques
    document.getElementById('quick-stats').style.display = 'none';

    // On recharge la page
    window.location.reload();
}

// Fonction pour mettre à jour l'interface selon la connexion
function mettreAJourInterfaceConnexion(nomUtilisateur) {
    const boutonOuvrirConnexion = document.getElementById('toggleLoginButton');
    const badigeUtilisateur = document.getElementById('connectedUserBadge');
    const nomAffiche = document.getElementById('connectedUser');

    if (nomUtilisateur) {
        // L'utilisateur est connecté
        nomAffiche.textContent = nomUtilisateur;
        badigeUtilisateur.style.display = 'inline-flex';
        boutonOuvrirConnexion.style.display = 'none';
    } else {
        // L'utilisateur est déconnecté
        nomAffiche.textContent = '';
        badigeUtilisateur.style.display = 'none';
        boutonOuvrirConnexion.style.display = 'inline-flex';
    }
}

function afficherFormulaire() {
    document.getElementById('loginSection').style.display = 'block';
}

// ==========================================
// INITIALISATION AU DÉMARRAGE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // On initialise les boutons de connexion
    initialiserBoutonsConnexion();

    // On initialise le menu de navigation
    initialiserNavigation();

    // On vérifie si l'utilisateur était connecté avant
    const idUtilisateur = localStorage.getItem('userId');
    const nomUtilisateur = localStorage.getItem('userLogin');

    if (idUtilisateur && nomUtilisateur) {
        mettreAJourInterfaceConnexion(nomUtilisateur);
    }

    // On affiche la page d'accueil
    afficherSection('accueil');
});

// Fonction pour initialiser le menu
function initialiserNavigation() {
    // Gestion du bouton de connexion
    const boutonOuvrir = document.getElementById('toggleLoginButton');
    const formuConexion = document.getElementById('loginSection');

    if (boutonOuvrir && formuConexion) {
        boutonOuvrir.addEventListener('click', () => {
            formuConexion.style.display = formuConexion.style.display === 'none' ? 'block' : 'none';
        });

        // On ferme la boîte si on clique en dehors
        document.addEventListener('click', function(event) {
            const clicDedans = formuConexion.contains(event.target) ||
                              boutonOuvrir.contains(event.target);

            if (!clicDedans && formuConexion.style.display === 'block') {
                formuConexion.style.display = 'none';
            }
        });
    }
}

// ==========================================
// STATISTIQUES RAPIDES (PAGE ACCUEIL)
// ==========================================

function mettreAJourStatsRapides() {
    const idUtilisateur = localStorage.getItem('userId');
    const statsRapides = document.getElementById('quick-stats');

    if (!idUtilisateur) {
        statsRapides.style.display = 'none';
        return;
    }

    // On récupère le planning du serveur
    fetch(`/weekly-plan/${idUtilisateur}`)
        .then(response => response.json())
        .then(data => {
            let totalSeances = 0;
            let totalExos = 0;
            const groupesMusculaires = new Set();

            // On compte les séances et les exercices
            Object.values(data).forEach(seance => {
                if (seance && seance.exercises) {
                    totalSeances++;
                    totalExos += seance.exercises.length;
                    seance.exercises.forEach(ex => groupesMusculaires.add(ex.muscle));
                }
            });

            // On affiche les résultats
            document.getElementById('total-sessions').textContent = totalSeances;
            document.getElementById('total-exercises').textContent = totalExos;
            document.getElementById('muscle-groups').textContent = groupesMusculaires.size;

            statsRapides.style.display = 'block';
        })
        .catch(error => {
            console.error('Erreur lors du chargement des statistiques:', error);
            statsRapides.style.display = 'none';
        });
}

// ==========================================
// PLANNING HEBDOMADAIRE (SEMAINE)
// ==========================================

function initialiserPlanningHebdo() {
    const apercuSemaine = document.getElementById('weekly-overview');
    const detailsJour = document.getElementById('day-details');
    const titreJour = document.getElementById('selected-day-title');
    const boutonModifier = document.getElementById('btn-modify-session');
    const boutonFermer = document.getElementById('btn-close-day');

    // On charge le planning depuis le serveur
    chargerPlanningHebdo();

    // Si on clique sur un jour, on affiche ses détails
    apercuSemaine.addEventListener('click', (e) => {
        const carteJour = e.target.closest('.weekly-day-card');
        if (carteJour) {
            const jour = carteJour.dataset.day;
            jourSelectionne = jour;
            afficherDetailsJour(jour);
        }
    });

    // Bouton pour modifier la séance du jour
    boutonModifier.addEventListener('click', () => {
        afficherSection('programme');
    });

    // Bouton pour fermer les détails
    boutonFermer.addEventListener('click', () => {
        detailsJour.style.display = 'none';
        jourSelectionne = null;
    });
}

function afficherDetailsJour(jour) {
    const detailsJour = document.getElementById('day-details');
    const titreJour = document.getElementById('selected-day-title');

    titreJour.innerHTML = `<i class="fas fa-calendar-day"></i> Séance du ${mettreEnMajuscule(jour)}`;
    afficherSeanceSauveegardee(jour);
    detailsJour.style.display = 'block';
}

function chargerPlanningHebdo() {
    const idUtilisateur = localStorage.getItem('userId');
    if (!idUtilisateur) return;

    // On récupère le planning depuis le serveur
    fetch(`/weekly-plan/${idUtilisateur}`)
        .then(response => response.json())
        .then(data => {
            monPlanningHebdo = {
                lundi: data.lundi || null,
                mardi: data.mardi || null,
                mercredi: data.mercredi || null,
                jeudi: data.jeudi || null,
                vendredi: data.vendredi || null,
                samedi: data.samedi || null,
                dimanche: data.dimanche || null
            };
            afficherApercuSemaine();
        })
        .catch(error => {
            console.error('Erreur lors du chargement du planning:', error);
            alert('Erreur lors du chargement du planning');
        });
}

function supprimerSeance(jour) {
    if (confirm(`Voulez-vous vraiment supprimer la séance du ${jour} ?`)) {
        const idUtilisateur = localStorage.getItem('userId');

        // On envoie la requête de suppression au serveur
        fetch(`/delete-session/${idUtilisateur}/${jour}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                monPlanningHebdo[jour] = null;
                afficherSeanceSauveegardee(jour);
                afficherApercuSemaine();
            })
            .catch(error => {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression de la séance');
            });
    }
}

function afficherSeanceSauveegardee(jour) {
    const affichageSeance = document.getElementById('saved-session-display');
    const seance = monPlanningHebdo[jour];

    if (!seance || !seance.exercises || seance.exercises.length === 0) {
        affichageSeance.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Aucune séance enregistrée pour ce jour</p>
                <button onclick="afficherSection('programme')" class="btn-capture">
                    <i class="fas fa-plus"></i> Créer un programme
                </button>
            </div>
        `;
        return;
    }

    // On regroupe les exercices par groupe musculaire
    const groupes = seance.exercises.reduce((acc, ex) => {
        if (!acc[ex.muscle]) acc[ex.muscle] = [];
        acc[ex.muscle].push(ex);
        return acc;
    }, {});

    let html = `
        <div class="session-preview">
            <h4><i class="fas fa-dumbbell"></i> ${seance.exercises.length} exercice(s) programmé(s)</h4>
    `;

    Object.entries(groupes).forEach(([muscle, exercices]) => {
        html += `<div style="margin-top: 1rem;"><strong style="color: var(--primary-color);">${muscle}:</strong><br>`;
        exercices.forEach(ex => {
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
            <button class="btn-delete-session" onclick="supprimerSeance('${jour}')">
                <i class="fas fa-trash"></i> Supprimer cette séance
            </button>
        </div>
    `;

    affichageSeance.innerHTML = html;
}

function afficherApercuSemaine() {
    const apercu = document.getElementById('weekly-overview');
    if (!apercu) return;

    let html = '';
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const icons = {
        'lundi': 'fa-moon', 'mardi': 'fa-fire', 'mercredi': 'fa-star',
        'jeudi': 'fa-bolt', 'vendredi': 'fa-rocket', 'samedi': 'fa-sun', 'dimanche': 'fa-bed'
    };

    jours.forEach(jour => {
        const seance = monPlanningHebdo[jour];
        const aUneSeance = seance && seance.exercises && seance.exercises.length > 0;

        html += `
            <div class="weekly-day-card ${!aUneSeance ? 'rest-day' : ''}" data-day="${jour}">
                <div class="day-header">
                    <i class="fas ${icons[jour]}"></i>
                    <h4>${mettreEnMajuscule(jour)}</h4>
                </div>
                ${aUneSeance ? 
                    `<p>${seance.exercises.length} exercice(s)</p>
                     <div class="muscle-groups">
                         ${[...new Set(seance.exercises.map(ex => ex.muscle))].join(', ')}
                     </div>` : 
                    '<p>Jour de repos</p>'}
            </div>
        `;
    });

    apercu.innerHTML = html;
}

// ==========================================
// SÉLECTION D'EXERCICES (CRÉER UN PROGRAMME)
// ==========================================

function initialiserSelectionExercices() {
    const selectionExercice = document.getElementById("exercise-selection");
    const sauvegarderProgramme = document.getElementById("save-program");

    if (!selectionExercice || !sauvegarderProgramme) return;

    // On définit tous les exercices disponibles par groupe musculaire
    const exercicesParMuscle = {
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

    const conteneur = document.getElementById("exercises-container");
    const textCompteur = document.getElementById("counter-text");
    const boiteCompteur = document.getElementById("exercise-counter");
    const boutonReset = document.getElementById("btn-reset");
    const boutonSauvegarder = document.getElementById("btn-save-program");
    const boutonRetour = document.getElementById("btn-back-selection");
    const boutonsJour = document.getElementById("save-day-buttons");
    const boutonValider = document.getElementById("btn-validate");

    let jourChoisPourSauv = null;

    // Fonction pour afficher tous les exercices
    function afficherExercices() {
        conteneur.innerHTML = "";
        Object.entries(exercicesParMuscle).forEach(([muscle, exercices]) => {
            const section = document.createElement("section");
            section.innerHTML = `<h3>${muscle}</h3>`;

            const grille = document.createElement("div");
            grille.className = "d-flex flex-wrap justify-content-center";

            exercices.forEach(ex => {
                const estSelectionnee = mesExercicesChoisis.some(sel => sel.name === ex.name);
                const carte = document.createElement("div");
                carte.className = `card m-2 p-2 exercise-card ${estSelectionnee ? "border border-warning" : ""}`;
                carte.style.width = "180px";
                carte.style.cursor = "pointer";
                carte.innerHTML = `
                    <img src="${ex.image}" class="card-img-top" alt="${ex.name}">
                    <div class="card-body text-center"><p>${ex.name}</p></div>
                `;
                carte.addEventListener("click", () => basculerExercice(ex, muscle));
                grille.appendChild(carte);
            });

            section.appendChild(grille);
            conteneur.appendChild(section);
        });
    }

    // Fonction pour ajouter/enlever un exercice de la sélection
    function basculerExercice(ex, muscle) {
        const index = mesExercicesChoisis.findIndex(e => e.name === ex.name);
        if (index >= 0) {
            mesExercicesChoisis.splice(index, 1);
        } else {
            mesExercicesChoisis.push({ ...ex, muscle });
        }
        mettreAJourInterface();
    }

    // Fonction pour mettre à jour l'interface
    function mettreAJourInterface() {
        textCompteur.textContent = `${mesExercicesChoisis.length} exercice${mesExercicesChoisis.length > 1 ? "s" : ""} sélectionné${mesExercicesChoisis.length > 1 ? "s" : ""}`;
        boiteCompteur.style.display = mesExercicesChoisis.length ? "block" : "none";
        boutonReset.style.display = mesExercicesChoisis.length ? "inline-block" : "none";

        if (mesExercicesChoisis.length > 0) {
            document.getElementById("btn-validate").style.display = "inline-block";
        } else {
            document.getElementById("btn-validate").style.display = "none";
        }
    }

    // Bouton pour valider et aller à la sauvegarde
    boutonValider.addEventListener("click", () => {
        if (mesExercicesChoisis.length === 0) return;
        selectionExercice.style.display = "none";
        sauvegarderProgramme.style.display = "block";
    });

    // Bouton pour réinitialiser la sélection
    boutonReset.addEventListener("click", reinitialiserSelection);

    function reinitialiserSelection() {
        if (confirm("Supprimer toutes les sélections ?")) {
            mesExercicesChoisis = [];
            mettreAJourInterface();
        }
    }

    // Gestion du choix du jour pour sauvegarde
    boutonsJour.addEventListener("click", (e) => {
        if (e.target.closest(".day-btn")) {
            const btn = e.target.closest(".day-btn");
            boutonsJour.querySelectorAll(".day-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            jourChoisPourSauv = btn.dataset.day;
            boutonSauvegarder.disabled = false;
        }
    });

    // Bouton pour enregistrer le programme
    boutonSauvegarder.addEventListener("click", () => {
        if (!jourChoisPourSauv || mesExercicesChoisis.length === 0) return;

        const idUtilisateur = localStorage.getItem('userId');
        if (!idUtilisateur) {
            alert('Vous devez être connecté pour enregistrer un planning');
            return;
        }

        // On envoie les données au serveur
        fetch('/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: idUtilisateur,
                day: jourChoisPourSauv,
                exercises: mesExercicesChoisis
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(`Programme enregistré pour le ${jourChoisPourSauv} !`);
            mesExercicesChoisis = [];
            jourChoisPourSauv = null;
            sauvegarderProgramme.style.display = "none";
            selectionExercice.style.display = "block";
            mettreAJourInterface();
            chargerPlanningHebdo(); // On recharge le planning
        })
        .catch(error => {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde du programme');
        });
    });

    // Bouton pour revenir à la sélection
    boutonRetour.addEventListener("click", () => {
        sauvegarderProgramme.style.display = "none";
        selectionExercice.style.display = "block";
        jourChoisPourSauv = null;
        boutonsJour.querySelectorAll(".day-btn").forEach(b => b.classList.remove("active"));
        boutonSauvegarder.disabled = true;
    });

    afficherExercices();
}

// ==========================================
// PAGE PROFIL (MES INFORMATIONS)
// ==========================================

function initialiserPageProfil() {
    const idUtilisateur = localStorage.getItem('userId');
    const nomUtilisateur = localStorage.getItem('userLogin');

    const messageNonConnecte = document.getElementById('not-connected-message');
    const contenuProfil = document.getElementById('profile-content');

    if (!idUtilisateur || !nomUtilisateur) {
        messageNonConnecte.style.display = 'block';
        contenuProfil.style.display = 'none';
        return;
    }

    messageNonConnecte.style.display = 'none';
    contenuProfil.style.display = 'block';

    // On affiche les informations du profil
    document.getElementById('profile-username').textContent = nomUtilisateur;
    document.getElementById('profile-member-since').textContent = new Date().toLocaleDateString('fr-FR');

    // On charge le planning pour le profil
    chargerPlanningSemaineProfil();
}

function chargerPlanningSemaineProfil() {
    const idUtilisateur = localStorage.getItem('userId');
    const conteneur = document.getElementById('profile-weekly-schedule');

    if (!idUtilisateur || !conteneur) return;

    fetch(`/weekly-plan/${idUtilisateur}`)
        .then(response => response.json())
        .then(data => {
            let html = '';

            // On vérifie s'il y a au moins une séance
            if (Object.values(data).every(seance => !seance || !seance.exercises || seance.exercises.length === 0)) {
                html = '<p class="text-muted">Aucun planning défini cette semaine</p>';
            } else {
                const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
                const icons = {
                    'lundi': 'fa-moon', 'mardi': 'fa-fire', 'mercredi': 'fa-star',
                    'jeudi': 'fa-bolt', 'vendredi': 'fa-rocket', 'samedi': 'fa-sun', 'dimanche': 'fa-bed'
                };

                jours.forEach(jour => {
                    const seance = data[jour];
                    const aUneSeance = seance && seance.exercises && seance.exercises.length > 0;

                    html += `
                        <div class="profile-day-item ${aUneSeance ? 'has-session' : 'rest-day'}">
                            <div class="day-icon">
                                <i class="fas ${icons[jour]}"></i>
                            </div>
                            <div class="day-info">
                                <strong>${mettreEnMajuscule(jour)}</strong>
                                ${aUneSeance ? `<br><small>${seance.exercises.length} exercice(s)</small>` : '<br><small>Jour de repos</small>'}
                            </div>
                        </div>
                    `;
                });
            }

            conteneur.innerHTML = html;
        })
        .catch(error => {
            console.error('Erreur lors du chargement du planning:', error);
            conteneur.innerHTML = '<p class="text-danger">Erreur de chargement</p>';
        });
}

function chargerStatsGroupesMusculaires() {
    const idUtilisateur = localStorage.getItem('userId');
    const conteneur = document.getElementById('muscle-groups-chart');

    if (!idUtilisateur || !conteneur) return;

    fetch(`/weekly-plan/${idUtilisateur}`)
        .then(response => response.json())
        .then(data => {
            const statsMusculaires = {};

            // On compte les exercices par groupe musculaire
            Object.values(data).forEach(seance => {
                if (seance && seance.exercises) {
                    seance.exercises.forEach(ex => {
                        statsMusculaires[ex.muscle] = (statsMusculaires[ex.muscle] || 0) + 1;
                    });
                }
            });

            if (Object.keys(statsMusculaires).length === 0) {
                conteneur.innerHTML = '<p class="text-muted">Aucun exercice programmé</p>';
                return;
            }

            let html = '';
            Object.entries(statsMusculaires).forEach(([muscle, count]) => {
                const pourcentage = Math.round((count / Object.values(statsMusculaires).reduce((a, b) => a + b, 0)) * 100);
                html += `
                    <div class="muscle-group-item">
                        <div class="muscle-info">
                            <span class="muscle-name">${muscle}</span>
                            <span class="muscle-count">${count} ex.</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${pourcentage}%"></div>
                        </div>
                    </div>
                `;
            });

            conteneur.innerHTML = html;
        })
        .catch(error => {
            console.error('Erreur lors du chargement des statistiques:', error);
            conteneur.innerHTML = '<p class="text-danger">Erreur de chargement</p>';
        });
}

function chargerHistoriqueSeances() {
    const idUtilisateur = localStorage.getItem('userId');
    const conteneur = document.getElementById('session-history');

    if (!idUtilisateur || !conteneur) return;

    // Pour l'instant, on affiche un historique simple
    // Dans une vraie app, ce serait envoyé par le serveur
    conteneur.innerHTML = `
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
// FONCTIONS UTILITAIRES
// ==========================================

// Fonction pour mettre la première lettre en majuscule
function mettreEnMajuscule(texte) {
    return texte.charAt(0).toUpperCase() + texte.slice(1);
}