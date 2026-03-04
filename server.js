// Import des modules nécessaires
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
// Connexion à la base de données MySQL
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'assesNodeServerDemo',
    password: 'assesNodeServerDemo',
    database: 'projet_seances_loic',
});
// Vérifie si la connexion à la BDD fonctionne
connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données : ', err);
        return;
    }
    console.log('Connecté à la base de données MySQL.');
});
const app = express();
// Permet d'utiliser les fichiers statiques dans le dossier public
app.use(express.static('public'));
// Permet de lire les données JSON envoyées par le front
app.use(express.json());
// Route principale vers l'index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// ===================== ROUTES UTILISATEUR =====================
// Récupère tous les utilisateurs de la base
app.get('/user', (req, res) => {
    connection.query('SELECT * FROM user', (err, results) => {
        if (err) { 
            res.status(500).json({ message: 'Erreur serveur' }); 
            return; 
        }
        res.json(results);
    });
});
// Inscription d’un nouvel utilisateur
app.post('/register', async (req, res) => {
    try {
        connection.query('SELECT id FROM user WHERE login = ?', [req.body.login], async (err, results) => { // Vérifie si le login existe déjà
            if (err) { 
                res.status(500).json({ message: 'Erreur serveur' }); 
                return; 
            }
            // Si le login est déjà utilisé
            if (results.length > 0) { 
                res.status(409).json({ message: 'Ce login est déjà utilisé', success: false }); 
                return; 
            }
            // Hash le mot de passe pour plus de sécurité
            const motDePasseHache = await bcrypt.hash(req.body.password, 10);
            // Ajoute le nouvel utilisateur dans la BDD
            connection.query(
                'INSERT INTO user (login, password) VALUES (?, ?)', 
                [req.body.login, motDePasseHache], 
                (err, results) => {
                    if (err) { 
                        res.status(500).json({ message: 'Erreur serveur' }); 
                        return; 
                    }
                    res.json({ 
                        message: 'Inscription réussie !', 
                        userId: results.insertId, 
                        success: true 
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
// Connexion d’un utilisateur
app.post('/connexion', async (req, res) => {
    const { login, password } = req.body;
    // Recherche l’utilisateur par son login
    connection.query('SELECT * FROM user WHERE login = ?', [login], async (err, results) => {
        if (err) { 
            res.status(500).json({ message: 'Erreur serveur' }); 
            return; 
        }
        // Si aucun utilisateur trouvé message d’erreur
        if (results.length === 0) { 
            res.status(401).json({ message: 'Identifiants invalides', success: false }); 
            return; 
        }
        // Compare le mot de passe avec le hash stocké
        const match = await bcrypt.compare(password, results[0].password);
        if (!match) { 
            res.status(401).json({ message: 'Identifiants invalides', success: false }); 
            return; 
        }
        // Message si connexion réussie
        res.json({ message: 'Connexion réussie !', user: results[0] });
    });
});
// ===================== ROUTES PLANNING =====================
// Enregistre une nouvelle séance
app.post('/save-session', (req, res) => {
    const { userId, day, sessionName, exercises } = req.body;
    // Vérifie que toutes les données sont présentes
    if (!userId) { 
        res.status(400).json({ message: 'Utilisateur non connecté' }); 
        return; 
    }
    // Si il manque des données essentielles pour enregistrer la séance
    if (!day || !exercises || !sessionName) { 
        res.status(400).json({ message: 'Données incomplètes' }); 
        return; 
    }
    // Convertit les exercices en JSON pour stockage
    const exercisesJson = JSON.stringify(exercises);
    const savedDate = new Date();
    // SQL pour inserer la séance dans la base
    connection.query(
        'INSERT INTO seances (userId, day, sessionName, exercises, savedDate) VALUES (?, ?, ?, ?, ?)',
        [userId, day, sessionName, exercisesJson, savedDate],
        (err, results) => {
            if (err) { 
                console.error(err); 
                res.status(500).json({ message: 'Erreur serveur' }); 
                return; 
            }
            res.json({ message: 'Séance enregistrée !', sessionId: results.insertId });
        }
    );
});
// Permet de mettre à jour une séance si elle est deja existante
app.put('/update-session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const { sessionName, exercises } = req.body;
    connection.query(
        'UPDATE seances SET sessionName = ?, exercises = ? WHERE id = ?',
        [sessionName, JSON.stringify(exercises), sessionId],
        (err) => {
            if (err) { 
                res.status(500).json({ message: 'Erreur serveur' }); 
                return; 
            }
            res.json({ message: 'Séance mise à jour !' });
        }
    );
});
// Récupère toutes les séances d’un utilisateur
app.get('/weekly-plan/:userId', (req, res) => {
    connection.query(
        'SELECT * FROM seances WHERE userId = ? ORDER BY day, savedDate ASC',
        [req.params.userId],
        (err, results) => {
            if (err) { 
                res.status(500).json({ message: 'Erreur serveur' }); 
                return; 
            }
            // Regroupe les séances par jour
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
// Supprime une séance par son ID
app.delete('/delete-session/:sessionId', (req, res) => {
    connection.query('DELETE FROM seances WHERE id = ?', [req.params.sessionId], (err, results) => {
        if (err) { 
            res.status(500).json({ message: 'Erreur serveur' }); 
            return; 
        }
        if (results.affectedRows === 0) { 
            res.status(404).json({ message: 'Séance introuvable' }); 
            return; 
        }
        res.json({ message: 'Séance supprimée !' });
    });
});
// Démarre le serveur sur le port 3000
app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});