# Guide de Déploiement GitHub

## Instructions pour envoyer le projet vers GitHub

### Méthode 1 : Via Replit (Recommandée)

1. **Connecter votre compte GitHub à Replit** :
   - Allez dans les paramètres de votre compte Replit
   - Connectez votre compte GitHub

2. **Utiliser la fonction d'export de Replit** :
   - Dans votre Repl, cliquez sur l'icône des trois points (⋮)
   - Sélectionnez "Export to GitHub"
   - Créez un nouveau repository ou sélectionnez un repository existant

### Méthode 2 : Téléchargement et upload manuel

1. **Télécharger le projet** :
   - Dans Replit, cliquez sur les trois points (⋮)
   - Sélectionnez "Download as zip"
   - Extrayez le fichier ZIP sur votre ordinateur

2. **Créer un repository GitHub** :
   - Allez sur github.com
   - Cliquez sur "New repository"
   - Nommez-le (ex: "ridvan-calendar")
   - Ne cochez PAS "Initialize with README"

3. **Envoyer le code** :
   ```bash
   cd votre-dossier-projet
   git init
   git add .
   git commit -m "Initial commit - Calendrier Riḍván"
   git branch -M main
   git remote add origin https://github.com/VOTRE_USERNAME/ridvan-calendar.git
   git push -u origin main
   ```

### Configuration pour le déploiement

Pour déployer l'application ailleurs, vous aurez besoin de :

1. **Variables d'environnement** :
   - `DATABASE_URL` : URL de connexion PostgreSQL
   - `SESSION_SECRET` : Clé secrète pour les sessions (générez-en une)

2. **Base de données PostgreSQL** :
   - L'application créera automatiquement les tables nécessaires
   - Aucune migration manuelle requise

3. **Scripts de démarrage** :
   - `npm run dev` : Développement
   - `npm run build` : Construction pour production
   - `npm start` : Démarrage en production

### Structure des branches recommandée

- `main` : Version stable de production
- `develop` : Version de développement
- `feature/*` : Nouvelles fonctionnalités

### Notes importantes

- Le dossier `attached_assets` contient vos images téléchargées
- Le fichier `data/` contient les scripts d'initialisation de la base de données
- Les fichiers Replit-spécifiques (`.replit`, `replit.nix`) sont ignorés par Git