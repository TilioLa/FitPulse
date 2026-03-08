# FitPulse - SaaS de Sport

Ébauche complète d'un SaaS de sport avec toutes les fonctionnalités de base.

## 🚀 Fonctionnalités

### Navigation
- Barre de navigation principale avec logo, liens vers toutes les pages
- Menu latéral dans le dashboard
- Footer avec mentions légales, contact et réseaux sociaux

### Pages disponibles
- **Page d'accueil** : Hero section, avantages, témoignages, aperçu des programmes, FAQ
- **Dashboard** : Mes séances, Historique, Programmes recommandés, Paramètres
- **Programmes** : Liste complète avec filtres (niveau, matériel, zone du corps)
- **Profil** : Informations personnelles, statistiques, historique
- **Pricing** : Plans Freemium / Pro / Pro+ avec switch interactif
- **Connexion / Inscription** : Authentification simulée

### Fonctionnalités techniques
- Navigation complète fonctionnelle
- Authentification simulée avec localStorage
- Dashboard dynamique avec séances, timer, historique
- Base de données simple (localStorage)
- Design responsive et moderne
- Palette de couleurs dynamiques

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📦 Technologies utilisées

- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling moderne et responsive
- **Lucide React** : Icônes modernes
- **localStorage** : Stockage local pour simulation de base de données

## 📁 Structure du projet

```
FitPulse/
├── app/                    # Pages Next.js
│   ├── dashboard/         # Dashboard avec menu latéral
│   ├── pricing/           # Page tarifs
│   ├── connexion/         # Page connexion
│   ├── inscription/       # Page inscription
│   ├── profil/            # Page profil
│   └── programmes/        # Liste des programmes
├── components/            # Composants React
│   ├── home/             # Composants page d'accueil
│   ├── dashboard/        # Composants dashboard
│   ├── pricing/          # Composants pricing
│   └── programmes/       # Composants programmes
└── public/               # Fichiers statiques
```

## 🎨 Design

- Palette de couleurs : Bleu primary, accent violet/rose
- Typographie : Inter (Google Fonts)
- Style : Moderne, épuré, mobile-friendly
- Icônes : Lucide React pour cohérence visuelle

## 📝 Notes

- L'authentification est simulée avec localStorage (pas de vraie base de données)
- Les paiements sont simulés (pas de transaction réelle)
- Les données sont stockées localement dans le navigateur
- Parfait pour prototyper et tester l'expérience utilisateur

## 🚧 Prochaines étapes

- Connecter à une vraie base de données (PostgreSQL, MongoDB)
- Implémenter un système d'authentification réel (NextAuth.js)
- Ajouter un système de paiement (Stripe)
- Intégrer des vidéos réelles pour les exercices
- Ajouter plus de programmes et exercices

