# Calendrier Interactif Bahá'í - Riḍván

Une application de calendrier interactif pour Riḍván, offrant une plateforme numérique complète pour explorer le contenu spirituel grâce à une intégration technologique avancée et une conception centrée sur l'utilisateur.

## Technologies Clés

- **Frontend** : React avec TypeScript
- **Backend** : Express.js
- **Base de données** : PostgreSQL
- **Gestion d'état** : React Query
- **Système de contenu multilingue**
- **Fonctionnalités avancées de rendu de contenu et d'expérience utilisateur**

## Fonctionnalités

- ✨ Interface basée sur des étoiles à 9 branches interactives
- 🎯 Nombre de jours configurable (1-30)
- 📱 Design responsive pour tous les appareils
- 🔐 Interface d'administration avec authentification
- 🎨 Personnalisation visuelle complète
- 📋 Système de gestion de contenu supportant :
  - Texte
  - Images avec légendes multi-lignes
  - Vidéos (YouTube, YouTube Shorts)
  - Audio
  - Citations
  - Liens

## Installation

1. Clonez le repository :
```bash
git clone https://github.com/VOTRE_USERNAME/ridvan-calendar.git
cd ridvan-calendar
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez la base de données PostgreSQL et définissez la variable d'environnement `DATABASE_URL`

4. Lancez l'application :
```bash
npm run dev
```

## Administration

- **Accès** : Utilisez Ctrl+Alt+A sur la page d'accueil ou naviguez vers `/admin`
- **Mot de passe** : 9999
- **Fonctionnalités** :
  - Gestion du contenu par jour
  - Personnalisation de l'apparence
  - Configuration du nombre de jours

## Structure du Projet

```
├── client/          # Application React frontend
├── server/          # API Express.js backend
├── shared/          # Schémas et types partagés
└── data/           # Scripts d'initialisation de la base de données
```

## Licence

Ce projet est développé pour la communauté Bahá'í.