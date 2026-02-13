// ==========================================
// MES VARIABLES
// ==========================================

let mesExercices = [];
let planning = {};
let jourChoisi = null;
let pageActuelle = 'accueil';
let sessionEnEdition = null;

// ==========================================
// NAVIGATION
// ==========================================

function changerPage(nom) {
    document.querySelectorAll('.content-section').forEach(p => p.classList.remove('active'));
    let page = document.getElementById(nom + '-section');
    if (page) { page.classList.add('active'); pageActuelle = nom; }
    document.querySelectorAll('.navbar-nav .nav-link').forEach(l => l.classList.remove('active'));
    let lien = document.querySelector('[href="#' + nom + '"]');
    if (lien) lien.classList.add('active');
    if (nom === 'planning') chargerPlanning();
    if (nom === 'programme') afficherExercices();
    if (nom === 'profil') afficherProfil();
}

// ==========================================
// CONNEXION
// ==========================================

let champLogin = document.getElementById('loginInput');
let champPassword = document.getElementById('passwordInput');

document.getElementById('registerButton').addEventListener('click', function() {
    let login = champLogin.value, password = champPassword.value;
    if (!login || !password) { alert('Remplis tous les champs !'); return; }
    fetch('/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, password }) })
        .then(r => r.json()).then(data => {
            alert(data.message);
            if (data.success) document.getElementById('loginButton').click();
            else window.location.reload();
        });
});

document.getElementById('loginButton').addEventListener('click', function() {
    let login = champLogin.value, password = champPassword.value;
    if (!login || !password) { alert('Remplis tous les champs !'); return; }
    fetch('/connexion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, password }) })
        .then(r => r.json()).then(data => {
            if (data.success !== false) {
                alert(data.message);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userLogin', login);
                afficherUser(login);
                document.getElementById('loginSection').style.display = 'none';
                champLogin.value = ''; champPassword.value = '';
            } else { alert(data.message); }
        });
});

function deconnecter() {
    localStorage.removeItem('userId'); localStorage.removeItem('userLogin');
    afficherUser(null); window.location.reload();
}

function afficherUser(login) {
    let bouton = document.getElementById('toggleLoginButton');
    let badge = document.getElementById('connectedUserBadge');
    let nom = document.getElementById('connectedUser');
    if (login) { nom.textContent = login; badge.style.display = 'inline-flex'; bouton.style.display = 'none'; }
    else { nom.textContent = ''; badge.style.display = 'none'; bouton.style.display = 'inline-flex'; }
}

// ==========================================
// DÉMARRAGE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    let bouton = document.getElementById('toggleLoginButton');
    let menu = document.getElementById('loginSection');
    bouton.addEventListener('click', function() {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', function(e) {
        if (!menu.contains(e.target) && !bouton.contains(e.target)) menu.style.display = 'none';
    });
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
    if (!userId) { afficherSemaine(); return; }

    fetch('/weekly-plan/' + userId)
        .then(r => r.json())
        .then(data => { planning = data; afficherSemaine(); });

    let overview = document.getElementById('weekly-overview');
    let newOverview = overview.cloneNode(true);
    overview.parentNode.replaceChild(newOverview, overview);
    newOverview.addEventListener('click', function(e) {
        let carte = e.target.closest('.weekly-day-card');
        if (carte) { jourChoisi = carte.dataset.day; afficherJour(jourChoisi); }
    });

    document.getElementById('btn-modify-session').onclick = function() { changerPage('programme'); };
    document.getElementById('btn-close-day').onclick = function() {
        document.getElementById('day-details').style.display = 'none';
    };
}

function afficherJour(jour) {
    let titre = jour.charAt(0).toUpperCase() + jour.slice(1);
    document.getElementById('selected-day-title').innerHTML = '<i class="fas fa-calendar-day"></i> ' + titre;
    afficherSeances(jour);
    document.getElementById('day-details').style.display = 'block';
    document.getElementById('btn-modify-session').style.display = 'none';
}

function afficherSeances(jour) {
    let zone = document.getElementById('saved-session-display');
    let seances = planning[jour];

    let html = '<div style="text-align:center;margin-bottom:1.5rem;">' +
        '<button onclick="nouvelleSeance(\'' + jour + '\')" class="btn-capture">' +
        '<i class="fas fa-plus"></i> Ajouter une séance</button></div>';

    if (!seances || seances.length === 0) {
        html += '<div style="text-align:center;padding:1rem;color:var(--text-muted);">' +
            '<i class="fas fa-calendar-times" style="font-size:2rem;"></i><p>Aucune séance ce jour</p></div>';
        zone.innerHTML = html; return;
    }

    for (let i = 0; i < seances.length; i++) {
        let s = seances[i];
        let parMuscle = {};
        for (let j = 0; j < s.exercises.length; j++) {
            let ex = s.exercises[j];
            if (!parMuscle[ex.muscle]) parMuscle[ex.muscle] = [];
            parMuscle[ex.muscle].push(ex);
        }
        html += '<div class="seance-block">' +
            '<div class="seance-header">' +
            '<span class="seance-name"><i class="fas fa-dumbbell"></i> ' + s.sessionName + '</span>' +
            '<div class="seance-actions">' +
            '<button onclick="modifierSeance(' + s.id + ',\'' + jour + '\')" class="btn-seance-edit"><i class="fas fa-edit"></i></button>' +
            '<button onclick="supprimerSeance(' + s.id + ',\'' + jour + '\')" class="btn-seance-delete"><i class="fas fa-trash"></i></button>' +
            '</div></div><div class="seance-body">';
        let muscles = Object.keys(parMuscle);
        for (let m = 0; m < muscles.length; m++) {
            html += '<div class="seance-muscle-group"><strong>' + muscles[m] + '</strong>';
            for (let k = 0; k < parMuscle[muscles[m]].length; k++) {
                let ex = parMuscle[muscles[m]][k];
                html += '<div class="exercise-item"><img src="' + ex.image + '" width="50"><span>' + ex.name + '</span></div>';
            }
            html += '</div>';
        }
        html += '</div></div>';
    }
    zone.innerHTML = html;
}

function nouvelleSeance(jour) {
    jourChoisi = jour; mesExercices = []; sessionEnEdition = null;
    changerPage('programme');
}

function modifierSeance(sessionId, jour) {
    jourChoisi = jour; sessionEnEdition = sessionId;
    let seances = planning[jour];
    for (let i = 0; i < seances.length; i++) {
        if (seances[i].id === sessionId) {
            mesExercices = JSON.parse(JSON.stringify(seances[i].exercises));
            break;
        }
    }
    changerPage('programme');
}

function supprimerSeance(sessionId, jour) {
    if (!confirm('Supprimer cette séance ?')) return;
    fetch('/delete-session/' + sessionId, { method: 'DELETE' })
        .then(r => r.json())
        .then(() => {
            if (planning[jour]) {
                planning[jour] = planning[jour].filter(s => s.id !== sessionId);
                if (planning[jour].length === 0) delete planning[jour];
            }
            afficherSeances(jour);
            afficherSemaine();
        });
}

function afficherSemaine() {
    let zone = document.getElementById('weekly-overview');
    if (!zone) return;
    let jours = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
    let icones = { lundi:'fa-moon', mardi:'fa-fire', mercredi:'fa-star', jeudi:'fa-bolt', vendredi:'fa-rocket', samedi:'fa-sun', dimanche:'fa-bed' };
    let html = '';
    for (let i = 0; i < jours.length; i++) {
        let jour = jours[i];
        let seances = planning[jour];
        let nb = seances ? seances.length : 0;
        let titre = jour.charAt(0).toUpperCase() + jour.slice(1);
        html += '<div class="weekly-day-card ' + (nb === 0 ? 'rest-day' : '') + '" data-day="' + jour + '">' +
            '<div class="day-header"><i class="fas ' + icones[jour] + '"></i><h4>' + titre + '</h4></div>';
        if (nb > 0) {
            let noms = seances.map(s => s.sessionName).join(', ');
            html += '<p>' + nb + ' séance' + (nb > 1 ? 's' : '') + '</p><div class="muscle-groups">' + noms + '</div>';
        } else { html += '<p>Repos</p>'; }
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
    let jourPourSauver = jourChoisi;

    // Pré-remplir le nom si édition
    let nomInput = document.getElementById('session-name-input');
    if (sessionEnEdition && jourChoisi && planning[jourChoisi]) {
        let seances = planning[jourChoisi];
        for (let i = 0; i < seances.length; i++) {
            if (seances[i].id === sessionEnEdition) { nomInput.value = seances[i].sessionName; break; }
        }
    } else { nomInput.value = ''; }

    // Pré-sélectionner le jour
    if (jourPourSauver) {
        let btnJour = document.querySelector('.day-btn[data-day="' + jourPourSauver + '"]');
        if (btnJour) {
            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
            btnJour.classList.add('active');
            document.getElementById("btn-save-program").disabled = false;
        }
    }

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
                let selectionne = mesExercices.some(e => e.name === ex.name);
                let carte = document.createElement("div");
                carte.className = "card m-2 p-2 exercise-card" + (selectionne ? " border border-warning" : "");
                carte.style.width = "180px"; carte.style.cursor = "pointer";
                carte.innerHTML = '<img src="' + ex.image + '" class="card-img-top"><div class="card-body text-center"><p>' + ex.name + '</p></div>';
                carte.addEventListener("click", function() {
                    let idx = mesExercices.findIndex(e => e.name === ex.name);
                    if (idx >= 0) mesExercices.splice(idx, 1);
                    else mesExercices.push({ name: ex.name, image: ex.image, muscle: muscle });
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
    rafraichir();

    // Cloner boutons pour éviter doublons de listeners
    ['btn-validate','btn-reset','btn-save-program','btn-back-selection','save-day-buttons'].forEach(id => {
        let el = document.getElementById(id);
        if (el) { let clone = el.cloneNode(true); el.parentNode.replaceChild(clone, el); }
    });

    document.getElementById("btn-validate").addEventListener("click", function() {
        if (mesExercices.length === 0) return;
        document.getElementById("exercise-selection").style.display = "none";
        document.getElementById("save-program").style.display = "block";
    });

    document.getElementById("btn-reset").addEventListener("click", function() {
        if (confirm("Tout supprimer ?")) { mesExercices = []; rafraichir(); }
    });

    document.getElementById("save-day-buttons").addEventListener("click", function(e) {
        let btn = e.target.closest(".day-btn");
        if (btn) {
            document.querySelectorAll(".day-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            jourPourSauver = btn.dataset.day;
            document.getElementById("btn-save-program").disabled = false;
        }
    });

    document.getElementById("btn-save-program").addEventListener("click", function() {
        if (!jourPourSauver || mesExercices.length === 0) return;
        let userId = localStorage.getItem('userId');
        if (!userId) { alert('Connecte-toi !'); return; }
        let nomSeance = document.getElementById('session-name-input').value.trim();
        if (!nomSeance) { alert('Donne un nom à ta séance !'); return; }

        if (sessionEnEdition) {
            fetch('/update-session/' + sessionEnEdition, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionName: nomSeance, exercises: mesExercices })
            }).then(r => r.json()).then(() => {
                if (planning[jourPourSauver]) {
                    planning[jourPourSauver].forEach(s => {
                        if (s.id === sessionEnEdition) { s.sessionName = nomSeance; s.exercises = mesExercices; }
                    });
                }
                reinitialiserFormulaire();
                changerPage('planning');
                setTimeout(() => { jourChoisi = jourPourSauver; afficherJour(jourChoisi); }, 100);
            });
        } else {
            fetch('/save-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, day: jourPourSauver, sessionName: nomSeance, exercises: mesExercices })
            }).then(r => r.json()).then(data => {
                if (!planning[jourPourSauver]) planning[jourPourSauver] = [];
                planning[jourPourSauver].push({ id: data.sessionId, sessionName: nomSeance, exercises: mesExercices });
                let jourSave = jourPourSauver;
                reinitialiserFormulaire();
                changerPage('planning');
                setTimeout(() => { jourChoisi = jourSave; afficherJour(jourChoisi); }, 100);
            });
        }
    });

    document.getElementById("btn-back-selection").addEventListener("click", function() {
        document.getElementById("save-program").style.display = "none";
        document.getElementById("exercise-selection").style.display = "block";
        document.querySelectorAll(".day-btn").forEach(b => b.classList.remove("active"));
        if (jourChoisi) {
            let btn = document.querySelector('.day-btn[data-day="' + jourChoisi + '"]');
            if (btn) { btn.classList.add('active'); document.getElementById("btn-save-program").disabled = false; }
        } else { document.getElementById("btn-save-program").disabled = true; }
    });
}

function reinitialiserFormulaire() {
    mesExercices = []; sessionEnEdition = null;
    document.getElementById("save-program").style.display = "none";
    document.getElementById("exercise-selection").style.display = "block";
    let nomInput = document.getElementById('session-name-input');
    if (nomInput) nomInput.value = '';
}

// ==========================================
// PROFIL
// ==========================================

function afficherProfil() {
    let userId = localStorage.getItem('userId');
    let userLogin = localStorage.getItem('userLogin');
    if (!userId || !userLogin) {
        document.getElementById('pas-connecte-message').style.display = 'block';
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
    fetch('/weekly-plan/' + userId).then(r => r.json()).then(data => {
        let jours = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
        let icones = { lundi:'fa-moon', mardi:'fa-fire', mercredi:'fa-star', jeudi:'fa-bolt', vendredi:'fa-rocket', samedi:'fa-sun', dimanche:'fa-bed' };
        let html = '';
        for (let i = 0; i < jours.length; i++) {
            let jour = jours[i];
            let seances = data[jour];
            let nb = seances ? seances.length : 0;
            let titre = jour.charAt(0).toUpperCase() + jour.slice(1);
            html += '<div class="profile-day-item ' + (nb > 0 ? 'has-session' : '') + '">' +
                '<div class="day-icon"><i class="fas ' + icones[jour] + '"></i></div>' +
                '<strong>' + titre + '</strong>';
            html += nb > 0 ? '<small>' + nb + ' séance' + (nb > 1 ? 's' : '') + '</small>' : '<small>Repos</small>';
            html += '</div>';
        }
        conteneur.innerHTML = html;
    });
}