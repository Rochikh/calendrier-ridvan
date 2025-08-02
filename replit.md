# Calendrier Interactif Bahá'í - Riḍván

## Vue d'ensemble du projet
Application de calendrier interactif pour Riḍván offrant une plateforme numérique complète pour explorer le contenu spirituel. Le projet utilise React/TypeScript pour le frontend, Express.js pour le backend, et PostgreSQL pour la persistance des données.

## Architecture du projet

### Technologies utilisées
- **Frontend** : React avec TypeScript, Tailwind CSS, React Query
- **Backend** : Express.js avec TypeScript
- **Base de données** : PostgreSQL avec Drizzle ORM
- **Authentification** : Sessions avec tokens
- **Gestion d'état** : React Query pour les appels API

### Structure des fichiers
```
├── client/          # Application React frontend
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── pages/       # Pages de l'application
│   │   ├── contexts/    # Contextes React (Auth)
│   │   └── lib/         # Utilitaires et configuration
├── server/          # API Express.js backend
│   ├── db.ts           # Configuration base de données
│   ├── storage.ts      # Interface de stockage
│   ├── routes.ts       # Routes API
│   └── index.ts        # Point d'entrée serveur
├── shared/          # Schémas et types partagés
└── data/           # Scripts d'initialisation DB
```

## Fonctionnalités principales

### Interface utilisateur
- ✨ Grille d'étoiles interactives à 9 branches (requirement critique)
- 🎯 Nombre de jours configurable (1-30)
- 📱 Design responsive multi-plateforme
- 🎨 Personnalisation visuelle complète
- 🔄 États de chargement pour éviter les affichages temporaires

### Système de gestion de contenu
- 📝 Texte avec formatage
- 🖼️ Images avec légendes multi-lignes (zone de texte avec retours à la ligne)
- 🎥 Vidéos YouTube (support des Shorts)
- 🎵 Audio
- 📖 Citations
- 🔗 Liens

### Administration
- 🔐 Authentification par mot de passe (9999)
- 🖥️ Interface d'administration tabbed (Contenu/Paramètres)
- 🎨 Personnalisation des couleurs et du background
- 📊 Gestion du contenu par jour
- 🔒 Accès masqué pour les utilisateurs (Ctrl+Alt+A)

## Préférences utilisateur

### Communication
- Réponses en français
- Style professionnel et concis
- Focus sur les solutions pratiques

### Développement
- Préservation des retours à la ligne dans les légendes
- Interface de chargement élégante
- Authentification sécurisée avec tokens
- Persistance des données en PostgreSQL

## Changements récents

### 2025-08-02
- ✅ Masquage du lien "Administrator Access" pour les utilisateurs non connectés
- ✅ Ajout du raccourci clavier secret Ctrl+Alt+A pour accès admin
- ✅ Amélioration des légendes d'images avec zones de texte multi-lignes
- ✅ Correction des états de chargement pour éviter l'affichage temporaire de 19 étoiles
- ✅ Support amélioré des YouTube Shorts
- ✅ Préparation pour export GitHub avec README.md et DEPLOYMENT.md

### Configuration technique
- Mot de passe admin : 9999
- Authentification : Sessions avec X-Admin-Secret header
- Base de données : Auto-initialisation des tables
- Déploiement : Prêt pour export GitHub

## Export GitHub
Le projet est maintenant prêt pour être exporté vers GitHub avec :
- README.md complet avec instructions
- .gitignore approprié pour Node.js/React
- Guide de déploiement DEPLOYMENT.md
- Documentation technique complète

### Méthodes d'export recommandées
1. Export direct via Replit → GitHub
2. Téléchargement ZIP et upload manuel
3. Clone local avec configuration Git

## Notes importantes
- Les étoiles doivent toujours avoir exactement 9 branches
- Les retours à la ligne dans les légendes sont préservés avec `whitespace-pre-line`
- L'accès admin est masqué aux utilisateurs normaux mais accessible via Ctrl+Alt+A
- La base de données s'initialise automatiquement au démarrage