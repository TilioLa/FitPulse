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
- **Contact** : Formulaire et coordonnées
- **Mentions légales / Confidentialité / CGV** : Pages légales statiques

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

## 🔐 Auth & Base de données (Supabase + Prisma)

1. Créez un projet Supabase et récupérez la chaîne de connexion Postgres.
2. Créez un fichier `.env` en vous basant sur `.env.example` :

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.uhldlcrfncbnnhwmeaje.supabase.co:5432/postgres"
NEXTAUTH_SECRET="replace-with-strong-secret"
NEXTAUTH_URL="http://localhost:3000"
```

3. Générez le client Prisma et migrez :

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Lancez le projet :

```bash
npm run dev
```

## 💳 Paiements Stripe (mode test)

Ajoutez les variables Stripe dans `.env` :

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_PROPLUS="price_..."
STRIPE_SUCCESS_URL="http://localhost:3000/dashboard?checkout=success"
STRIPE_CANCEL_URL="http://localhost:3000/pricing?checkout=cancel"
```

Les boutons Pro/Pro+ redirigent vers Stripe Checkout.

## 🔁 Mot de passe oublié (SMTP Gmail)

Ajoutez les variables SMTP dans `.env` :

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_gmail@gmail.com"
SMTP_PASS="your_gmail_app_password"
EMAIL_FROM="FitPulse <your_gmail@gmail.com>"
```

Les pages de reset sont :
- `/reset` (demande de lien)
- `/reset/[token]` (nouveau mot de passe)

## 📦 Technologies utilisées

- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling moderne et responsive
- **Lucide React** : Icônes modernes
- **localStorage** : Stockage local pour simulation de base de données
- **SEO Next.js** : `sitemap.xml` et `robots.txt` générés via l'App Router
- **API Next.js** : Endpoints d'authentification
- **Toasts** : Notifications locales pour feedback utilisateur
- **Auth.js (NextAuth v5)** : Authentification avec Credentials
- **Prisma + Supabase Postgres** : ORM et base de données

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

- L'authentification utilise Auth.js (NextAuth) avec Prisma + Supabase
- Les paiements sont simulés (pas de transaction réelle)
- Les données d'entraînement (séances, stats, préférences) restent en local via `localStorage`
- Parfait pour prototyper et tester l'expérience utilisateur
- Les pages légales et la page contact sont statiques dans cette version
- Le sitemap et le robots.txt utilisent `https://fitpulse.fr` comme URL de base (à adapter pour la prod)
- Les endpoints d'authentification (`/api/auth/*`) sont des stubs pour préparer l'intégration backend
- Les endpoints `/api/auth/*` utilisent Prisma + Supabase
- L'inscription est limitée aux adresses Gmail
- Un champ `phone` est disponible pour le profil utilisateur

## 🚧 Prochaines étapes

- Connecter à une vraie base de données (PostgreSQL, MongoDB)
- Implémenter un système d'authentification réel (NextAuth.js)
- Ajouter un système de paiement (Stripe)
- Intégrer des vidéos réelles pour les exercices
- Ajouter plus de programmes et exercices
