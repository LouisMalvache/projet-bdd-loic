-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : mer. 11 fév. 2026 à 09:47
-- Version du serveur : 10.11.14-MariaDB-0+deb12u2
-- Version de PHP : 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `projet_seances_loic`
--

-- --------------------------------------------------------

--
-- Structure de la table `seances`
--

CREATE TABLE `seances` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `day` varchar(20) NOT NULL,
  `exercises` text NOT NULL,
  `savedDate` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `seances`
--

INSERT INTO `seances` (`id`, `userId`, `day`, `exercises`, `savedDate`) VALUES
(16, 1, 'vendredi', '[{\"name\":\"Élévations latérales\",\"image\":\"img/elevation-laterale.gif\",\"muscle\":\"Épaules\"}]', '2026-02-09 15:09:34'),
(20, 3, 'lundi', '[{\"name\":\"Élévations latérales\",\"image\":\"img/elevation-laterale.gif\",\"muscle\":\"Épaules\"},{\"name\":\"Curl haltères incliné\",\"image\":\"img/curl-haltere-incline.gif\",\"muscle\":\"Biceps\"},{\"name\":\"Curl marteau\",\"image\":\"img/curl-marteau.gif\",\"muscle\":\"Biceps\"},{\"name\":\"Extension corde arrière\",\"image\":\"img/extension-verticale-triceps-poulie-basse.gif\",\"muscle\":\"Triceps\"},{\"name\":\"Extension corde haute\",\"image\":\"img/extension-haute.gif\",\"muscle\":\"Triceps\"}]', '2026-02-09 15:35:28'),
(23, 4, 'vendredi', '[{\"name\":\"Curl marteau\",\"image\":\"img/curl-marteau.gif\",\"muscle\":\"Biceps\"},{\"name\":\"Curl pupitre machine\",\"image\":\"img/curl-pupitre-machine.gif\",\"muscle\":\"Biceps\"}]', '2026-02-09 16:30:50'),
(24, 3, 'dimanche', '[{\"name\":\"Élévations latérales\",\"image\":\"img/elevation-laterale.gif\",\"muscle\":\"Épaules\"},{\"name\":\"Élévations frontales\",\"image\":\"img/elevation-frontale.gif\",\"muscle\":\"Épaules\"},{\"name\":\"Développé militaire\",\"image\":\"img/Le-Developpe-Militaire.gif\",\"muscle\":\"Épaules\"},{\"name\":\"Shrugs\",\"image\":\"img/shrugs-avec-halteres.gif\",\"muscle\":\"Épaules\"},{\"name\":\"Développé épaules assis\",\"image\":\"img/developpe-epaules-assis.gif\",\"muscle\":\"Épaules\"}]', '2026-02-10 10:13:22'),
(25, 3, 'mardi', '[{\"name\":\"Squat\",\"image\":\"img/squat.gif\",\"muscle\":\"Jambes\"},{\"name\":\"Presse à cuisses\",\"image\":\"img/presse-a-cuisses-inclinee.gif\",\"muscle\":\"Jambes\"},{\"name\":\"Leg extension\",\"image\":\"img/leg-extension.gif\",\"muscle\":\"Jambes\"},{\"name\":\"leg-curl-allonge\",\"image\":\"img/leg-curl-allonge.gif\",\"muscle\":\"Jambes\"},{\"name\":\"Planche\",\"image\":\"img/planche-abdos.gif\",\"muscle\":\"Abdominaux\"}]', '2026-02-10 11:27:27');

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `login` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `dateInscription` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `user`
--

INSERT INTO `user` (`id`, `login`, `password`, `dateInscription`) VALUES
(1, 'caca', 'vnaq93cABUVeG5p', '2026-02-05 08:35:06'),
(3, 'louis', '1234', '2026-02-05 13:51:52'),
(4, 'aurelien', 'amat', '2026-02-09 16:08:03');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `seances`
--
ALTER TABLE `seances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_day` (`userId`,`day`);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `login` (`login`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `seances`
--
ALTER TABLE `seances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT pour la table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `seances`
--
ALTER TABLE `seances`
  ADD CONSTRAINT `seances_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;








/*!ALORS LA CE QU'IL Y A EN DESSOUS C POUR COPIER LES PRIVILIGIES */

# Privilèges pour `assesNodeServerDemo`@`%`

GRANT SELECT, INSERT, UPDATE, DELETE, FILE ON *.* TO `assesNodeServerDemo`@`%` IDENTIFIED BY PASSWORD '*16636F93552710D331142F4815D99F22640D59F7';

GRANT ALL PRIVILEGES ON `bddTest`.* TO `assesNodeServerDemo`@`%`;


# Privilèges pour `mysql`@`localhost`

GRANT ALL PRIVILEGES ON *.* TO `mysql`@`localhost` IDENTIFIED VIA mysql_native_password USING 'invalid' OR unix_socket WITH GRANT OPTION;

GRANT PROXY ON ''@'%' TO 'mysql'@'localhost' WITH GRANT OPTION;

GRANT PROXY ON ''@'%' TO 'mysql'@'localhost' WITH GRANT OPTION;


# Privilèges pour `root`@`localhost`

GRANT ALL PRIVILEGES ON *.* TO `root`@`localhost` IDENTIFIED BY PASSWORD '*81F5E21E35407D884A6CD4A731AEBFB6AF209E1B' WITH GRANT OPTION;

GRANT PROXY ON ''@'%' TO 'root'@'localhost' WITH GRANT OPTION;

GRANT PROXY ON ''@'%' TO 'root'@'localhost' WITH GRANT OPTION;