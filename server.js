// Import des modules nécessaires
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const dotenv = require('dotenv');
require('dotenv').config();

// Connexion à la base de données MySQL
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

connection.connect((err) => {
    if (err) { console.error('Erreur de connexion à la base de données : ', err); return; }
    console.log('Connecté à la base de données MySQL.');
});

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===================== ROUTES UTILISATEUR =====================

// Inscription d'un nouvel utilisateur
app.post('/register', async (req, res) => {
    if (!req.body || !req.body.login || !req.body.password) {
        return res.status(400).json({ message: 'Données manquantes', success: false });
    }
    try {
        connection.query('SELECT id FROM user WHERE login = ?', [req.body.login], async (err, results) => {
            if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
            if (results.length > 0) { res.status(409).json({ message: 'Ce login est déjà utilisé', success: false }); return; }
            const motDePasseHache = await bcrypt.hash(req.body.password, 10);
            connection.query(
                'INSERT INTO user (login, password) VALUES (?, ?)',
                [req.body.login, motDePasseHache],
                (err) => {
                    if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
                    res.json({ message: 'Inscription réussie !', success: true });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Connexion d'un utilisateur
app.post('/connexion', async (req, res) => {
    if (!req.body || !req.body.login || !req.body.password) {
        return res.status(400).json({ message: 'Données manquantes', success: false });
    }
    const { login, password } = req.body;
    connection.query('SELECT * FROM user WHERE login = ?', [login], async (err, results) => {
        if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
        if (results.length === 0) { res.status(401).json({ message: 'Identifiants invalides', success: false }); return; }
        const match = await bcrypt.compare(password, results[0].password);
        if (!match) { res.status(401).json({ message: 'Identifiants invalides', success: false }); return; }
        req.session.userId = results[0].id;
        req.session.userLogin = results[0].login;
        res.json({ message: 'Connexion réussie !', login: results[0].login });
    });
});

// Déconnexion
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Renvoie les infos de session
app.get('/me', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ connected: false });
    res.json({ connected: true, login: req.session.userLogin });
});

// ===================== ROUTES PLANNING =====================

// Enregistre une nouvelle séance
app.post('/save-session', (req, res) => {
    const userId = req.session.userId;
    if (!userId) { res.status(401).json({ message: 'Utilisateur non connecté' }); return; }
    if (!req.body || !req.body.day || !req.body.exercises || !req.body.sessionName) {
        return res.status(400).json({ message: 'Données incomplètes' });
    }
    const { day, sessionName, exercises } = req.body;
    const exercisesJson = JSON.stringify(exercises);
    const savedDate = new Date();
    connection.query(
        'INSERT INTO seances (userId, day, sessionName, exercises, savedDate) VALUES (?, ?, ?, ?, ?)',
        [userId, day, sessionName, exercisesJson, savedDate],
        (err, results) => {
            if (err) { console.error(err); res.status(500).json({ message: 'Erreur serveur' }); return; }
            res.json({ message: 'Séance enregistrée !', sessionId: results.insertId });
        }
    );
});

// Met à jour une séance
app.put('/update-session/:sessionId', (req, res) => {
    const userId = req.session.userId;
    if (!userId) { res.status(401).json({ message: 'Utilisateur non connecté' }); return; }
    if (!req.body || !req.body.sessionName || !req.body.exercises) {
        return res.status(400).json({ message: 'Données incomplètes' });
    }
    const { sessionId } = req.params;
    const { sessionName, exercises } = req.body;
    connection.query(
        'UPDATE seances SET sessionName = ?, exercises = ? WHERE id = ? AND userId = ?',
        [sessionName, JSON.stringify(exercises), sessionId, userId],
        (err) => {
            if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
            res.json({ message: 'Séance mise à jour !' });
        }
    );
});

// Récupère toutes les séances de l'utilisateur connecté
app.get('/weekly-plan', (req, res) => {
    const userId = req.session.userId;
    if (!userId) { res.status(401).json({ message: 'Utilisateur non connecté' }); return; }
    connection.query(
        'SELECT * FROM seances WHERE userId = ? ORDER BY day, savedDate ASC',
        [userId],
        (err, results) => {
            if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
            const semaine = {};
            results.forEach(row => {
                if (!semaine[row.day]) semaine[row.day] = [];
                semaine[row.day].push({
                    id: row.id,
                    sessionName: row.sessionName || 'Séance',
                    exercises: JSON.parse(row.exercises),
                    savedDate: row.savedDate
                });
            });
            res.json(semaine);
        }
    );
});

// Supprime une séance
app.delete('/delete-session/:sessionId', (req, res) => {
    const userId = req.session.userId;
    if (!userId) { res.status(401).json({ message: 'Utilisateur non connecté' }); return; }
    connection.query(
        'DELETE FROM seances WHERE id = ? AND userId = ?',
        [req.params.sessionId, userId],
        (err, results) => {
            if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
            if (results.affectedRows === 0) { res.status(404).json({ message: 'Séance introuvable' }); return; }
            res.json({ message: 'Séance supprimée !' });
        }
    );
});

// Récupère la date d'inscription
app.get('/me/profile', (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Non connecté' });
    connection.query('SELECT dateInscription FROM user WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) return res.json({ error: 'Introuvable' });
        res.json(results[0]);
    });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    if (err.type === 'request.aborted' || err.status === 400) {
        return res.status(400).json({ message: 'Requête invalide', success: false });
    }
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
});

// Démarre le serveur
app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});