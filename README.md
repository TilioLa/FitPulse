# FitPulse - SaaS de sport

Ébauche complète d'un SaaS de sport avec toutes les fonctionnalités de base.

## 🚀 Fonctionnalités

### Navigation
- Barre de navigation principale avec logo, liens vers toutes les pages
- Menu latéral dans le dashboard
- Footer avec mentions légales, contact et réseaux sociaux

### Pages disponibles
- **Page d'accueil** : section Hero, avantages, témoignages, aperçu des programmes, FAQ
- **Dashboard** : Mes séances, Historique, Programmes recommandés, Paramètres
- **Programmes** : Liste complète avec filtres (niveau, matériel, zone du corps)
- **Profil** : Informations personnelles, statistiques, historique
- **Tarifs** : plans Freemium / Pro / Pro+ avec sélecteur interactif
- **Connexion / Inscription** : Authentification simulée
- **Contact** : Formulaire et coordonnées
- **Mentions légales / Confidentialité / CGV** : Pages légales statiques

### Fonctionnalités techniques
- Navigation complète fonctionnelle
- Authentification Supabase Auth (email + mot de passe)
- Dashboard dynamique avec séances, minuteur, historique
- Données d'entraînement stockées en `localStorage`
- Design responsive moderne
- Palette de couleurs dynamiques

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## ✅ Tests E2E (Playwright)

```bash
npx playwright install chromium
npm run test:e2e
```

Le mode e2e active un bypass d'authentification dédié (`NEXT_PUBLIC_E2E_BYPASS_AUTH=true`) pour tester le flux d'entraînement sans dépendre de Supabase en direct.

Commandes utiles :

```bash
npm run test:e2e:standard   # pages publiques + workout + recovery
npm run test:e2e:auth-real  # connexion Supabase réelle (nécessite des secrets)
```

Pour `test:e2e:auth-real`, définir :
- `PLAYWRIGHT_E2E_BYPASS_AUTH=false`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`

## 🔐 Authentification (Supabase Auth)

1. Créez un projet Supabase et récupérez :
- `Project URL`
- `anon public key`
2. Créez un fichier `.env` en vous basant sur `.env.example` :

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

3. Lancez le projet :

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

## 🔁 Mot de passe oublié (Supabase)

Les pages de réinitialisation sont :
- `/reset` (demande de lien)
- `/reset/update` (nouveau mot de passe)

## ⏰ E-mails lifecycle + reminders (Vercel Cron)

Le projet inclut :
- `POST /api/lifecycle/send` (emails J+1, J+7, fin d'essai)
- `POST /api/reminders/send` (rappel séance du jour)
- `POST/GET /api/cron/engagement` (orchestrateur serveur)

Variables nécessaires :

```env
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
CRON_SECRET="CHANGE_ME"
ENABLE_SERVER_CRON_EMAILS="true"
ENABLE_LIFECYCLE_EMAILS="true"
ENABLE_REMINDER_EMAILS="true"
NEXT_PUBLIC_ENABLE_CLIENT_EMAIL_AUTOMATION="false"
NEXT_PUBLIC_ENABLE_WEB_NOTIFICATIONS="true"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="FitPulse <your-email@gmail.com>"
```

Le cron Vercel est défini dans `vercel.json` et appelle `/api/cron/engagement` chaque jour.
Les notifications navigateur locales (sans e-mail) sont activées via `NEXT_PUBLIC_ENABLE_WEB_NOTIFICATIONS`.

## 🔗 Partage public de séance (persistant Supabase)

Endpoints :
- `POST /api/share/create`
- `GET /api/share/[id]`
- `GET /api/profile/public/[slug]`
- `GET /api/profile/public/leaderboard?period=week|month&sort=sessions|volume|pr`

Pages:
- `/share?id=...` (séance partagée)
- `/share` (classement public simple)
- `/u/[slug]` (profil public léger)

Note : le suivi de profils (`Suivre`) est local au navigateur (`localStorage`), sans compte social.

Table SQL requise :

```sql
create table if not exists public.workout_shares (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
```

Le client essaie d’abord le lien court persistant (`/share?id=...`) et garde un fallback encodé (`/share?s=...`) si la table n’est pas encore disponible.

## 📦 Technologies utilisées

- **Next.js 14** : framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : style moderne et responsive
- **Lucide React** : icônes modernes
- **localStorage** : Stockage local pour simulation de base de données
- **SEO Next.js** : `sitemap.xml` et `robots.txt` générés via l'App Router
- **API Next.js** : endpoint Stripe checkout
- **Toasts** : notifications locales pour le feedback utilisateur
- **Supabase Auth** : authentification et réinitialisation du mot de passe

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

- Palette de couleurs : bleu principal, accent violet/rose
- Typographie : Inter (Google Fonts)
- Style : moderne, épuré, mobile-friendly
- Icônes : Lucide React pour la cohérence visuelle

## 📝 Notes

- L'authentification utilise Supabase Auth
- Les paiements sont simulés (pas de transaction réelle)
- Les données d'entraînement (séances, stats, préférences) restent en local via `localStorage`
- Projet idéal pour prototyper et tester l'expérience utilisateur
- Les pages légales et la page contact sont statiques dans cette version
- Le sitemap et `robots.txt` utilisent `https://fitpulse.fr` comme URL de base (à adapter pour la prod)
- Un champ `phone` est disponible pour le profil utilisateur

## 🚧 Prochaines étapes

- Connecter à une vraie base de données (PostgreSQL, MongoDB)
- Ajouter un système de paiement (Stripe)
- Intégrer des vidéos réelles pour les exercices
- Ajouter plus de programmes et exercices
