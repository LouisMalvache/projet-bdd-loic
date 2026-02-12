// ==========================================
// MES VARIABLES
// ==========================================

let mesExercices = [];
let planning = {
    lundi: null, mardi: null, mercredi: null, jeudi: null,
    vendredi: null, samedi: null, dimanche: null
};
let jourChoisi = null;
let pageActuelle = 'accueil';
let boutonsProgrammeInitialises = false; // Pour éviter de dupliquer les event listeners

// ==========================================
// NAVIGATION
// ==========================================

function changerPage(nom) {
    // Je cache tout
    let pages = document.querySelectorAll('.content-section');
    for (let i = 0; i < pages.length; i++) {
        pages[i].classList.remove('active');
    }

    // J'affiche la bonne page
    let page = document.getElementById(nom + '-section');
    if (page) {
        page.classList.add('active');
        pageActuelle = nom;
    }

    // Je mets à jour le menu
    let liens = document.querySelectorAll('.navbar-nav .nav-link');
    for (let i = 0; i < liens.length; i++) {
        liens[i].classList.remove('active');
    }
    let lien = document.querySelector('[href="#' + nom + '"]');
    if (lien) lien.classList.add('active');

    // Actions spéciales
    if (nom === 'planning') chargerPlanning();
    if (nom === 'programme') afficherExercices();
    if (nom === 'profil') afficherProfil();
}

// ==========================================
// CONNEXION
// ==========================================

let champLogin = document.getElementById('loginInput');
let champPassword = document.getElementById('passwordInput');

// Inscription
document.getElementById('registerButton').addEventListener('click', function() {
    let login = champLogin.value;
    let password = champPassword.value;

    if (!login || !password) {
        alert('Remplis tous les champs !');
        return;
    }
    
    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login, password: password })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        alert(data.message);
        if (data.success) {
            document.getElementById('loginButton').click();
        } else {
            window.location.reload();
        }
    });
});


// Connexion
document.getElementById('loginButton').addEventListener('click', function() {
    let login = champLogin.value;
    let password = champPassword.value;
    
    if (!login || !password) {
        alert('Remplis tous les champs !');
        return;
    }
    fetch('/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login, password: password })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success !== false) {
            alert(data.message);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userLogin', login);
            afficherUser(login);
            document.getElementById('loginSection').style.display = 'none';
            champLogin.value = '';
            champPassword.value = '';
        } else {
            alert(data.message);
        }
    });
});

// Déconnexion
function deconnecter() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userLogin');
    afficherUser(null);
    window.location.reload();
}

function afficherUser(login) {
    let bouton = document.getElementById('toggleLoginButton');
    let badge = document.getElementById('connectedUserBadge');
    let nom = document.getElementById('connectedUser');

    if (login) {
        nom.textContent = login;
        badge.style.display = 'inline-flex';
        bouton.style.display = 'none';
    } else {
        nom.textContent = '';
        badge.style.display = 'none';
        bouton.style.display = 'inline-flex';
    }
}

// ==========================================
// DÉMARRAGE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Menu connexion
    let bouton = document.getElementById('toggleLoginButton');
    let menu = document.getElementById('loginSection');
    
    bouton.addEventListener('click', function() {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', function(e) {
        if (!menu.contains(e.target) && !bouton.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    // Vérifier si connecté
    let userId = localStorage.getItem('userId');
    let userLogin = localStorage.getItem('userLogin');
    if (userId && userLogin) afficherUser(userLogin);

    changerPage('accueil');
});

// ==========================================
// PLANNING
// ==========================================

function chargerPlanning() {
    let userId = localStorage.getItem('userId');
    if (!userId) return;

    fetch('/weekly-plan/' + userId)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            planning = {
                lundi: data.lundi || null,
                mardi: data.mardi || null,
                mercredi: data.mercredi || null,
                jeudi: data.jeudi || null,
                vendredi: data.vendredi || null,
                samedi: data.samedi || null,
                dimanche: data.dimanche || null
            };
            afficherSemaine();
        });

    // Clic sur un jour
    document.getElementById('weekly-overview').addEventListener('click', function(e) {
        let carte = e.target.closest('.weekly-day-card');
        if (carte) {
            jourChoisi = carte.dataset.day;
            afficherJour(jourChoisi);
        }
    });

    // MODIFICATION ICI : Charger les exercices avant d'aller sur la page programme
    document.getElementById('btn-modify-session').addEventListener('click', function() {
        // Charger les exercices de la séance dans mesExercices
        if (jourChoisi && planning[jourChoisi] && planning[jourChoisi].exercises) {
            mesExercices = JSON.parse(JSON.stringify(planning[jourChoisi].exercises)); // Copie profonde
        }
        changerPage('programme');
    });

    document.getElementById('btn-close-day').addEventListener('click', function() {
        document.getElementById('day-details').style.display = 'none';
    });
}

function afficherJour(jour) {
    let titre = jour.charAt(0).toUpperCase() + jour.slice(1);
    document.getElementById('selected-day-title').innerHTML = 
        '<i class="fas fa-calendar-day"></i> Séance du ' + titre;
    afficherSeance(jour);
    document.getElementById('day-details').style.display = 'block';
}

function afficherSeance(jour) {
    let zone = document.getElementById('saved-session-display');
    let seance = planning[jour];

    if (!seance || !seance.exercises || seance.exercises.length === 0) {
        zone.innerHTML = '<div style="text-align: center; padding: 2rem;">' +
            '<i class="fas fa-calendar-times" style="font-size: 3rem;"></i>' +
            '<p>Aucune séance</p>' +
            '<button onclick="changerPage(\'programme\')" class="btn-capture">' +
            '<i class="fas fa-plus"></i> Créer</button></div>';
        return;
    }

    // Grouper par muscle
    let parMuscle = {};
    for (let i = 0; i < seance.exercises.length; i++) {
        let ex = seance.exercises[i];
        if (!parMuscle[ex.muscle]) parMuscle[ex.muscle] = [];
        parMuscle[ex.muscle].push(ex);
    }

    let html = '<div class="session-preview"><h4><i class="fas fa-dumbbell"></i> ' + 
        seance.exercises.length + ' exercice(s)</h4>';

    let muscles = Object.keys(parMuscle);
    for (let i = 0; i < muscles.length; i++) {
        let muscle = muscles[i];
        html += '<div style="margin-top: 1rem;"><strong>' + muscle + ':</strong><br>';
        for (let j = 0; j < parMuscle[muscle].length; j++) {
            let ex = parMuscle[muscle][j];
            html += '<div class="exercise-item"><img src="' + ex.image + '" width="60">' +
                '<span>' + ex.name + '</span></div>';
        }
        html += '</div>';
    }

    html += '<button class="btn-delete-session" onclick="supprimerSeance(\'' + jour + '\')">' +
        '<i class="fas fa-trash"></i> Supprimer</button></div>';
    zone.innerHTML = html;
}

function supprimerSeance(jour) {
    if (!confirm('Supprimer la séance ?')) return;
    
    let userId = localStorage.getItem('userId');
    fetch('/delete-session/' + userId + '/' + jour, { method: 'DELETE' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            alert(data.message);
            planning[jour] = null;
            afficherSeance(jour);
            afficherSemaine();
        });
}

function afficherSemaine() {
    let zone = document.getElementById('weekly-overview');
    if (!zone) return;

    let jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    let icones = {
        lundi: 'fa-moon', mardi: 'fa-fire', mercredi: 'fa-star',
        jeudi: 'fa-bolt', vendredi: 'fa-rocket', samedi: 'fa-sun', dimanche: 'fa-bed'
    };

    let html = '';
    for (let i = 0; i < jours.length; i++) {
        let jour = jours[i];
        let seance = planning[jour];
        let ok = seance && seance.exercises && seance.exercises.length > 0;
        let titre = jour.charAt(0).toUpperCase() + jour.slice(1);

        html += '<div class="weekly-day-card ' + (!ok ? 'rest-day' : '') + '" data-day="' + jour + '">' +
            '<div class="day-header"><i class="fas ' + icones[jour] + '"></i><h4>' + titre + '</h4></div>';

        if (ok) {
            let muscles = [];
            for (let j = 0; j < seance.exercises.length; j++) {
                if (!muscles.includes(seance.exercises[j].muscle)) {
                    muscles.push(seance.exercises[j].muscle);
                }
            }
            html += '<p>' + seance.exercises.length + ' exercice(s)</p>' +
                '<div class="muscle-groups">' + muscles.join(', ') + '</div>';
        } else {
            html += '<p>Repos</p>';
        }
        html += '</div>';
    }
    zone.innerHTML = html;
}

// ==========================================
// EXERCICES
// ==========================================

function afficherExercices() {
    let exercices = {
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
            { name: "Extension lombaires", image: "img/extension-lombaires.gif" }
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
            { name: "Leg curl allongé", image: "img/leg-curl-allonge.gif" },
            { name: "Fentes avant", image: "img/fentes-avant-kettlebell.gif" },
            { name: "Squat sauté", image: "img/squat-saute.gif" }
        ]
    };

    let conteneur = document.getElementById("exercises-container");
    // MODIFICATION ICI : Utiliser jourChoisi s'il existe (mode modification)
    let jourPourSauver = jourChoisi;

    function dessiner() {
        conteneur.innerHTML = "";
        let muscles = Object.keys(exercices);
        
        for (let i = 0; i < muscles.length; i++) {
            let muscle = muscles[i];
            let section = document.createElement("section");
            section.innerHTML = "<h3>" + muscle + "</h3>";
            let grille = document.createElement("div");
            grille.className = "d-flex flex-wrap justify-content-center";

            for (let j = 0; j < exercices[muscle].length; j++) {
                let ex = exercices[muscle][j];
                let selectionne = false;
                for (let k = 0; k < mesExercices.length; k++) {
                    if (mesExercices[k].name === ex.name) selectionne = true;
                }

                let carte = document.createElement("div");
                carte.className = "card m-2 p-2 exercise-card" + (selectionne ? " border border-warning" : "");
                carte.style.width = "180px";
                carte.style.cursor = "pointer";
                carte.innerHTML = '<img src="' + ex.image + '" class="card-img-top">' +
                    '<div class="card-body text-center"><p>' + ex.name + '</p></div>';
                
                carte.addEventListener("click", function() {
                    let idx = -1;
                    for (let k = 0; k < mesExercices.length; k++) {
                        if (mesExercices[k].name === ex.name) idx = k;
                    }
                    if (idx >= 0) {
                        mesExercices.splice(idx, 1);
                    } else {
                        mesExercices.push({ name: ex.name, image: ex.image, muscle: muscle });
                    }
                    rafraichir();
                });
                
                grille.appendChild(carte);
            }
            section.appendChild(grille);
            conteneur.appendChild(section);
        }
    }

    function rafraichir() {
        let nb = mesExercices.length;
        document.getElementById("counter-text").textContent = nb + ' exercice' + (nb > 1 ? 's' : '');
        document.getElementById("exercise-counter").style.display = nb ? "block" : "none";
        document.getElementById("btn-reset").style.display = nb ? "inline-block" : "none";
        document.getElementById("btn-validate").style.display = nb ? "inline-block" : "none";
        dessiner();
    }

    // MODIFICATION ICI : Rafraîchir au chargement pour afficher les exercices déjà sélectionnés
    rafraichir();

    // MODIFICATION ICI : Si on est en mode modification, pré-sélectionner le jour et activer le bouton
    if (jourPourSauver) {
        let btnJour = document.querySelector('.day-btn[data-day="' + jourPourSauver + '"]');
        if (btnJour) {
            btnJour.classList.add('active');
            document.getElementById("btn-save-program").disabled = false;
        }
    }

    // On n'initialise les boutons qu'une seule fois
    if (boutonsProgrammeInitialises) {
        return; // Si déjà fait, on arrête ici
    }
    boutonsProgrammeInitialises = true;

    // Boutons - INITIALISATION UNE SEULE FOIS
    document.getElementById("btn-validate").addEventListener("click", function() {
        if (mesExercices.length === 0) return;
        document.getElementById("exercise-selection").style.display = "none";
        document.getElementById("save-program").style.display = "block";
    });

    document.getElementById("btn-reset").addEventListener("click", function() {
        if (confirm("Tout supprimer ?")) {
            mesExercices = [];
            rafraichir();
        }
    });

    document.getElementById("save-day-buttons").addEventListener("click", function(e) {
        let btn = e.target.closest(".day-btn");
        if (btn) {
            let btns = document.querySelectorAll(".day-btn");
            for (let i = 0; i < btns.length; i++) btns[i].classList.remove("active");
            btn.classList.add("active");
            jourPourSauver = btn.dataset.day;
            document.getElementById("btn-save-program").disabled = false;
        }
    });

    // MODIFICATION ICI : Retourner au planning après sauvegarde
    document.getElementById("btn-save-program").addEventListener("click", function() {
        if (!jourPourSauver || mesExercices.length === 0) return;
        let userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Connecte-toi !');
            return;
        }

        fetch('/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, day: jourPourSauver, exercises: mesExercices })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            alert('Enregistré !');
            mesExercices = [];
            jourChoisi = null; // Réinitialiser jourChoisi
            jourPourSauver = null;
            document.getElementById("save-program").style.display = "none";
            document.getElementById("exercise-selection").style.display = "block";
            rafraichir();
            changerPage('planning'); // Retourner au planning
        });
    });

    document.getElementById("btn-back-selection").addEventListener("click", function() {
        document.getElementById("save-program").style.display = "none";
        document.getElementById("exercise-selection").style.display = "block";
        jourPourSauver = null;
        let btns = document.querySelectorAll(".day-btn");
        for (let i = 0; i < btns.length; i++) btns[i].classList.remove("active");
        document.getElementById("btn-save-program").disabled = true;
    });
}

// ==========================================
// PROFIL
// ==========================================

function afficherProfil() {
    let userId = localStorage.getItem('userId');
    let userLogin = localStorage.getItem('userLogin');

    if (!userId || !userLogin) {
        document.getElementById('pas-connected-message').style.display = 'block';
        document.getElementById('profile-content').style.display = 'none';
        return;
    }

    document.getElementById('pas-connecte-message').style.display = 'none';
    document.getElementById('profile-content').style.display = 'block';
    document.getElementById('profil-nom').textContent = userLogin;
    document.getElementById('profil-membre').textContent = new Date().toLocaleDateString('fr-FR');

    chargerPlanningProfil();
}

function chargerPlanningProfil() {
    let userId = localStorage.getItem('userId');
    let conteneur = document.getElementById('profile-weekly-schedule');
    if (!userId || !conteneur) return;

    fetch('/weekly-plan/' + userId)
        .then(function(r) { return r.json(); })
        .then(function(data) {
            let jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
            let icones = {
                lundi: 'fa-moon', mardi: 'fa-fire', mercredi: 'fa-star',
                jeudi: 'fa-bolt', vendredi: 'fa-rocket', samedi: 'fa-sun', dimanche: 'fa-bed'
            };
            let html = '';

            for (let i = 0; i < jours.length; i++) {
                let jour = jours[i];
                let seance = data[jour];
                let ok = seance && seance.exercises && seance.exercises.length > 0;
                let titre = jour.charAt(0).toUpperCase() + jour.slice(1);

                html += '<div class="profile-day-item ' + (ok ? 'has-session' : 'rest-day') + '">' +
                    '<div class="day-icon"><i class="fas ' + icones[jour] + '"></i></div>' +
                    '<div class="day-info"><strong>' + titre + '</strong>';
                
                if (ok) {
                    html += '<br><small>' + seance.exercises.length + ' exercice(s)</small>';
                } else {
                    html += '<br><small>Repos</small>';
                }
                html += '</div></div>';
            }

            conteneur.innerHTML = html;
        });
}