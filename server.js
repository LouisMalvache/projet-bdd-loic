const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');

const connection = mysql.createConnection({
    host: '127.0.0.1',  
    user: 'assesNodeServerDemo',
    password: 'assesNodeServerDemo',
    database: 'projet_seances_loic',
});

connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données : ', err);
        return;
    }
    console.log('Connecté à la base de données MySQL.');
});

const app = express();
app.use(express.static('public'));  
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// ROUTES UTILISATEUR
// ==========================================

app.get('/login', (req, res) => { res.send('bienvenu sur la page de connexion'); });
app.get('/info', (req, res) => { res.json({ cle1: 'valeur1', cle2: 'valeur2' }); });

app.get('/user', (req, res) => {
    connection.query('SELECT * FROM user', (err, results) => {
        if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
        res.json(results);
    });
});

app.post('/register', async (req, res) => {
    try {
        connection.query('SELECT id FROM user WHERE login = ?', [req.body.login], async (err, results) => {
            if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
            if (results.length > 0) { res.status(409).json({ message: 'Ce login est déjà utilisé', success: false }); return; }
            const motDePasseHache = await bcrypt.hash(req.body.password, 10);
            connection.query('INSERT INTO user (login, password) VALUES (?, ?)', [req.body.login, motDePasseHache], (err, results) => {
                if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
                res.json({ message: 'Inscription réussie !', userId: results.insertId, success: true });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

app.post('/connexion', async (req, res) => {
    const { login, password } = req.body;
    connection.query('SELECT * FROM user WHERE login = ?', [login], async (err, results) => {
        if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
        if (results.length === 0) { res.status(401).json({ message: 'Identifiants invalides', success: false }); return; }
        const match = await bcrypt.compare(password, results[0].password);
        if (!match) { res.status(401).json({ message: 'Identifiants invalides', success: false }); return; }
        res.json({ message: 'Connexion réussie !', user: results[0] });
    });
});

app.get('/connecte/:userId', (req, res) => {
    connection.query('SELECT * FROM user WHERE id = ?', [req.params.userId], (err, results) => {
        if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
        if (results.length === 0) { res.status(404).json({ message: 'Utilisateur non trouvé' }); return; }
        res.json(results[0]);
    });
});

// ==========================================
// ROUTES PLANNING — PLUSIEURS SÉANCES PAR JOUR
// ==========================================

// Sauvegarder une NOUVELLE séance (toujours INSERT)
app.post('/save-session', (req, res) => {
    const { userId, day, sessionName, exercises } = req.body;
    if (!userId) { res.status(400).json({ message: 'Utilisateur non connecté' }); return; }
    if (!day || !exercises || !sessionName) { res.status(400).json({ message: 'Données incomplètes' }); return; }

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

// Mettre à jour une séance existante par son ID
app.put('/update-session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const { sessionName, exercises } = req.body;
    connection.query(
        'UPDATE seances SET sessionName = ?, exercises = ? WHERE id = ?',
        [sessionName, JSON.stringify(exercises), sessionId],
        (err) => {
            if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
            res.json({ message: 'Séance mise à jour !' });
        }
    );
});

// Récupérer toutes les séances groupées par jour
app.get('/weekly-plan/:userId', (req, res) => {
    connection.query(
        'SELECT * FROM seances WHERE userId = ? ORDER BY day, savedDate ASC',
        [req.params.userId],
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

// Supprimer UNE séance par son ID
app.delete('/delete-session/:sessionId', (req, res) => {
    connection.query('DELETE FROM seances WHERE id = ?', [req.params.sessionId], (err, results) => {
        if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
        if (results.affectedRows === 0) { res.status(404).json({ message: 'Séance introuvable' }); return; }
        res.json({ message: 'Séance supprimée !' });
    });
});

// Supprimer tout le planning d'un utilisateur
app.delete('/delete-all-sessions/:userId', (req, res) => {
    connection.query('DELETE FROM seances WHERE userId = ?', [req.params.userId], (err, results) => {
        if (err) { res.status(500).json({ message: 'Erreur serveur' }); return; }
        res.json({ message: 'Planning supprimé !', deletedCount: results.affectedRows });
    });
});

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});