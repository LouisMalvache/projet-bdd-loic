const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const connection = mysql.createConnection({
    host: '172.29.18.118',
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

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// ROUTES UTILISATEUR
// ==========================================

app.get('/login', (req, res) => {
    res.send('bienvenu sur la page de connexion');
});

app.get('/info', (req, res) => {
    res.json({ cle1: 'valeur1', cle2: 'valeur2' });
});

app.get('/user', (req, res) => {
    connection.query('SELECT * FROM user', (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
        res.json(results);
    });
});

app.post('/register', (req, res) => {
    console.log('Données reçues pour l\'inscription :');
    console.log(req.body);
   
    connection.query(
        'INSERT INTO user (login, password) VALUES (?, ?)',
        [req.body.login, req.body.password],
        (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'insertion dans la base de données :', err);
                res.status(500).json({ message: 'Erreur serveur' });
                return;
            }
            console.log('Insertion réussie, ID utilisateur :', results.insertId);
            res.json({ message: 'Inscription réussie !', userId: results.insertId });
        }
    );
});

app.post('/connexion', (req, res) => {  
    console.log(req.body);
    const { login, password } = req.body;
    connection.query('SELECT * FROM user WHERE login = ? AND password = ?', [login, password], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification des identifiants :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
        }
        if (results.length === 0) {
            res.status(401).json({ message: 'Identifiants invalides' });
            return;
        }
        res.json({ message: 'Connexion réussie !', user: results[0] });
    });
});

app.get('/connecte/:userId', (req, res) => {
    const userId = req.params.userId;
    
    connection.query(
        'SELECT * FROM user WHERE id = ?',
        [userId],
        (err, results) => {
            if (err) {
                console.error('Erreur lors de la récupération des informations utilisateur :', err);
                res.status(500).json({ message: 'Erreur serveur' });
                return;
            }       
            if (results.length === 0) {
                res.status(404).json({ message: 'Utilisateur non trouvé' });
                return;
            } 
            res.json(results[0]);
        }
    );
});

// ==========================================
// ROUTES PLANNING HEBDOMADAIRE
// ==========================================

// Sauvegarder une séance pour un jour spécifique
app.post('/save-session', (req, res) => {
    console.log('Sauvegarde de séance reçue :');
    console.log(req.body);
    
    const { userId, day, exercises } = req.body;
    
    if (!userId) {
        res.status(400).json({ message: 'Utilisateur non connecté' });
        return;
    }
    
    if (!day || !exercises) {
        res.status(400).json({ message: 'Données incomplètes' });
        return;
    }
    
    // Convertir le tableau d'exercices en JSON
    const exercisesJson = JSON.stringify(exercises);
    const savedDate = new Date();
    
    // Vérifier si une séance existe déjà pour ce jour et cet utilisateur
    connection.query(
        'SELECT * FROM seances WHERE userId = ? AND day = ?',
        [userId, day],
        (err, results) => {
            if (err) {
                console.error('Erreur lors de la vérification de la séance :', err);
                res.status(500).json({ message: 'Erreur serveur' });
                return;
            }
            
            if (results.length > 0) {
                // Mettre à jour la séance existante
                connection.query(
                    'UPDATE seances SET exercises = ?, savedDate = ? WHERE userId = ? AND day = ?',
                    [exercisesJson, savedDate, userId, day],
                    (err, results) => {
                        if (err) {
                            console.error('Erreur lors de la mise à jour de la séance :', err);
                            res.status(500).json({ message: 'Erreur serveur' });
                            return;
                        }
                        console.log('Séance mise à jour avec succès');
                        res.json({ message: 'Séance mise à jour avec succès !' });
                    }
                );
            } else {
                // Insérer une nouvelle séance
                connection.query(
                    'INSERT INTO seances (userId, day, exercises, savedDate) VALUES (?, ?, ?, ?)',
                    [userId, day, exercisesJson, savedDate],
                    (err, results) => {
                        if (err) {
                            console.error('Erreur lors de l\'insertion de la séance :', err);
                            res.status(500).json({ message: 'Erreur serveur' });
                            return;
                        }
                        console.log('Séance enregistrée avec succès, ID :', results.insertId);
                        res.json({ message: 'Séance enregistrée avec succès !', sessionId: results.insertId });
                    }
                );
            }
        }
    );
});

// Récupérer toutes les séances d'un utilisateur
app.get('/weekly-plan/:userId', (req, res) => {
    const userId = req.params.userId;
    
    connection.query(
        'SELECT * FROM seances WHERE userId = ?',
        [userId],
        (err, results) => {
            if (err) {
                console.error('Erreur lors de la récupération du planning :', err);
                res.status(500).json({ message: 'Erreur serveur' });
                return;
            }
            
            // Convertir les exercices JSON en objets JavaScript
            const seancesSemaine = {};
            results.forEach(session => {
                seancesSemaine[session.day] = {
                    exercises: JSON.parse(session.exercises),
                    savedDate: session.savedDate
                };
            });
            
            res.json(seancesSemaine);
        }
    );
});

// Récupérer une séance spécifique pour un jour
app.get('/session/:userId/:day', (req, res) => {
    const { userId, day } = req.params;
    
    connection.query(
        'SELECT * FROM seances WHERE userId = ? AND day = ?',
        [userId, day],
        (err, results) => {
            if (err) {
                console.error('Erreur lors de la récupération de la séance :', err);
                res.status(500).json({ message: 'Erreur serveur' });
                return;
            }
            
            if (results.length === 0) {
                res.json({ message: 'Aucune séance pour ce jour', session: null });
                return;
            }
            
            const session = {
                exercises: JSON.parse(results[0].exercises),
                savedDate: results[0].savedDate
            };
            
            res.json({ session });
        }
    );
});

// Supprimer une séance
app.delete('/delete-session/:userId/:day', (req, res) => {
    const { userId, day } = req.params;
    
    connection.query(
        'DELETE FROM seances WHERE userId = ? AND day = ?',
        [userId, day],
        (err, results) => {
            if (err) {
                console.error('Erreur lors de la suppression de la séance :', err);
                res.status(500).json({ message: 'Erreur serveur' });
                return;
            }
            
            if (results.affectedRows === 0) {
                res.status(404).json({ message: 'Aucune séance trouvée pour ce jour' });
                return;
            }
            
            console.log('Séance supprimée avec succès');
            res.json({ message: 'Séance supprimée avec succès !' });
        }
    );
});

// Supprimer tout le planning d'un utilisateur
app.delete('/delete-all-sessions/:userId', (req, res) => {
    const userId = req.params.userId;
    
    connection.query(
        'DELETE FROM seances WHERE userId = ?',
        [userId],
        (err, results) => {
            if (err) {
                console.error('Erreur lors de la suppression du planning :', err);
                res.status(500).json({ message: 'Erreur serveur' });
                return;
            }
            
            console.log('Planning supprimé avec succès');
            res.json({ message: 'Planning supprimé avec succès !', deletedCount: results.affectedRows });
        }
    );
});



// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});