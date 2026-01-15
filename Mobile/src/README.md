# 🚌 TransportBF - Plateforme de Réservation de Transport Interurbain

Application web complète de réservation de transport pour le Burkina Faso, avec design system aux couleurs nationales et fonctionnalités avancées.

---

## 🎯 Fonctionnalités principales

### ✨ Pour les utilisateurs

- **🔍 Recherche de trajets** - Aller simple ou aller-retour
- **💺 Sélection de sièges interactive** - Plan du véhicule en temps réel
- **⏱️ Système HOLD/TTL** - 10 minutes pour finaliser la réservation
- **💳 Paiements multiples** - Orange Money, Moov Money, Cartes bancaires
- **🎫 Gestion des billets** - QR Code, transfert, annulation (jusqu'à 1h avant)
- **📍 Géolocalisation** - Trouver les gares à proximité
- **📱 Notifications** - Alertes temps réel (départ, retard, etc.)
- **🗺️ Tracking live** - Suivre son véhicule en temps réel
- **📖 Stories compagnies** - Promotions et actualités style Instagram
- **🌍 Multilingue** - Français, English, Mooré

### 🎨 Design & UX

- **🇧🇫 Design system BF** - Palette rouge/ambre/vert du drapeau
- **📱 Responsive** - Mobile-first, optimisé tablette/desktop
- **✨ Animations fluides** - Motion/React (Framer Motion)
- **🎭 Composants interactifs** - Swipe, pull-to-refresh, haptic feedback
- **♿ Accessibilité** - WCAG AA, navigation clavier, screen readers

### 💰 Monétisation

- **📢 Publicités interstitielles** - Système complet de pubs ciblées
- **📊 Analytics détaillées** - Impressions, clics, conversions, ROI
- **🎯 Ciblage avancé** - Par page, utilisateur, période
- **💵 Modèles multiples** - CPM, CPC, CPA, forfaits mensuels

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- npm ou yarn
- PostgreSQL (pour le backend)

### Installation

```bash
# Cloner le repo
git clone https://github.com/your-org/transportbf.git
cd transportbf

# Installer les dépendances
npm install

# Copier la config
cp .env.example .env

# Lancer en dev
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Configuration

Éditer le fichier `.env` :

```env
NODE_ENV=development
VITE_API_URL=http://localhost:3000
VITE_USE_MOCK_DATA=true
```

---

## 📁 Structure du projet

```
├── components/          # Composants React réutilisables
│   ├── ui/             # Composants UI (shadcn)
│   ├── AdModal.tsx     # Système de publicités
│   ├── Navigation.tsx  # Barre de navigation
│   └── ...
├── pages/              # Pages de l'application
│   ├── HomePage.tsx
│   ├── SearchResultsPage.tsx
│   ├── SeatSelectionPage.tsx
│   └── ...
├── lib/                # Utilitaires et helpers
│   ├── api.ts         # Client API
│   ├── config.ts      # Configuration centralisée
│   ├── hooks.ts       # Custom React hooks
│   └── i18n.ts        # Internationalisation
├── styles/             # Styles globaux
│   └── globals.css
├── migrations/         # Migrations SQL
│   ├── 001_create_operator_stories.sql
│   └── 002_create_advertisements.sql
├── backend-examples/   # Exemples de code backend
│   ├── operator-stories-routes.js
│   └── advertisements-routes.js
└── data/              # Modèles de données TypeScript
    └── models.ts
```

---

## 🛠️ Technologies utilisées

### Frontend

- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Composants UI
- **Motion** (Framer Motion) - Animations
- **Lucide React** - Icônes
- **Recharts** - Graphiques
- **Sonner** - Notifications toast

### Backend (exemples fournis)

- **Node.js + Express** - Serveur API
- **PostgreSQL** - Base de données
- **JWT** - Authentification
- **CORS** - Gestion cross-origin

---

## 📚 Documentation

### Guides utilisateur

- **Système de publicités**
  - [`SYSTEME_PUBLICITES.md`](./SYSTEME_PUBLICITES.md) - Documentation complète (1200+ lignes)
  - [`RECAP_SYSTEME_PUBLICITES.md`](./RECAP_SYSTEME_PUBLICITES.md) - Guide rapide
  - [`BACKEND_CONNECTION_CHECKLIST.md`](./BACKEND_CONNECTION_CHECKLIST.md) - Checklist backend

- **Système de stories**
  - [`BACKEND_API_STORIES.md`](./BACKEND_API_STORIES.md) - Documentation API
  - [`STORIES_IMPLEMENTATION_SUMMARY.md`](./STORIES_IMPLEMENTATION_SUMMARY.md) - Résumé

- **Aide contextuelle**
  - [`SYSTEME_AIDE_CONTEXTUELLE.md`](./SYSTEME_AIDE_CONTEXTUELLE.md) - Système de tutoriels

### Guides développeur

- [`ARCHITECTURE_CODE_COMPLETE.md`](./ARCHITECTURE_CODE_COMPLETE.md) - Architecture complète (1000+ lignes)
- [`PREPARATION_BACKEND_COMPLETE.md`](./PREPARATION_BACKEND_COMPLETE.md) - Backend prêt
- [`BACKEND_CHECKLIST.md`](./BACKEND_CHECKLIST.md) - Checklist d'implémentation
- [`GUIDE_DEPLOYMENT.md`](./GUIDE_DEPLOYMENT.md) - Guide de déploiement

### Analyse & Design

- [`ANALYSE_UX_PERSONAS.md`](./ANALYSE_UX_PERSONAS.md) - Personas et parcours utilisateurs
- [`guidelines/Guidelines.md`](./guidelines/Guidelines.md) - Guidelines design

---

## 🔧 Commandes

### Développement

```bash
# Lancer le serveur de dev
npm run dev

# Lancer avec host exposé (mobile/tablette)
npm run dev -- --host

# Type checking
npm run type-check
```

### Build

```bash
# Build de production
npm run build

# Preview du build
npm run preview
```

### Linting

```bash
# Linter le code
npm run lint

# Fixer automatiquement
npm run lint:fix
```

---

## 🌐 Connexion Backend

### Mode développement (Mock data)

Par défaut, l'app fonctionne avec des données mock :

```env
VITE_USE_MOCK_DATA=true
```

Aucun backend nécessaire pour tester les fonctionnalités !

### Mode production (Backend réel)

#### 1. Déployer la base de données

```bash
# Exécuter les migrations
psql -U postgres -d transportbf -f migrations/001_create_operator_stories.sql
psql -U postgres -d transportbf -f migrations/002_create_advertisements.sql
```

#### 2. Déployer les routes API

Copier les fichiers de `/backend-examples/` dans votre projet backend Express.js.

#### 3. Configurer l'URL de l'API

```env
VITE_API_URL=https://api.transportbf.com
VITE_USE_MOCK_DATA=false
```

#### 4. Rebuild et déployer

```bash
npm run build
# Puis déployer sur votre CDN/serveur
```

**Guide complet** : [`BACKEND_CONNECTION_CHECKLIST.md`](./BACKEND_CONNECTION_CHECKLIST.md)

---

## 📊 Système de publicités

### Vue d'ensemble

Le système de publicités permet de **monétiser l'application** en affichant des annonces ciblées :

- ✅ **Formats multiples** - Images, vidéos, gradients
- ✅ **Actions flexibles** - Navigation interne ou liens externes
- ✅ **Ciblage intelligent** - Par page, utilisateur, période
- ✅ **Tracking complet** - Impressions, clics, conversions
- ✅ **Fréquence limitée** - Anti-spam (5 min minimum)
- ✅ **Analytics détaillées** - Dashboard admin avec métriques

### Créer une annonce

**Via SQL** (pour tester) :

```sql
INSERT INTO advertisements (
  title, description, media_type, gradient, emoji,
  cta_text, action_type, internal_page,
  target_pages, priority, start_date, end_date, created_by
) VALUES (
  '🎉 Promotion -30%',
  'Profitez de réductions exceptionnelles !',
  'gradient',
  'linear-gradient(135deg, #EF2B2D, #FCD116, #009E49)',
  '🚌',
  'Réserver',
  'internal',
  'search-results',
  ARRAY['home'],
  8,
  NOW(),
  NOW() + INTERVAL '30 days',
  'ADMIN_USER_ID'
);
```

**Via Dashboard Admin** (recommandé en prod) :

Interface graphique pour gérer facilement les annonces.

### Revenus potentiels

**Exemple avec 1000 users actifs/jour** :

- 1000 users × 3 pubs/jour = 3000 impressions/jour
- CTR 4% = 120 clics/jour  
- CPC 150 FCFA = **18 000 FCFA/jour**
- **≈ 540 000 FCFA/mois**

**Documentation complète** : [`SYSTEME_PUBLICITES.md`](./SYSTEME_PUBLICITES.md)

---

## 🎨 Design System

### Palette de couleurs (Burkina Faso)

```css
--color-red: #EF2B2D      /* Rouge du drapeau */
--color-amber: #FCD116     /* Ambre/Or */
--color-green: #009E49     /* Vert du drapeau */

/* Gradients */
--gradient-bf: linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)
```

### Composants UI

Tous les composants shadcn/ui disponibles dans `/components/ui/` :

- Buttons, Cards, Dialogs, Alerts
- Forms, Inputs, Selects, Calendars
- Tables, Tabs, Accordions
- Charts, Carousels, Tooltips
- Et 30+ autres composants

---

## 🧪 Tests

### Tests manuels

```bash
# 1. Lancer l'app
npm run dev

# 2. Tester les fonctionnalités
- Recherche de trajets
- Sélection de sièges
- Système HOLD/TTL
- Paiement
- Publicités
```

### Tests backend

```bash
# Avec curl
curl http://localhost:3000/api/ads/active?page=home

# Avec Postman
Import les collections depuis /backend-examples/
```

---

## 🚀 Déploiement

### Frontend (Vercel, Netlify, etc.)

```bash
# Build de production
npm run build

# Le dossier dist/ contient les fichiers à déployer
```

**Variables d'environnement à configurer** :

```
VITE_API_URL=https://api.transportbf.com
VITE_USE_MOCK_DATA=false
NODE_ENV=production
```

### Backend (VPS, Heroku, Railway, etc.)

1. Déployer PostgreSQL
2. Exécuter les migrations
3. Déployer le serveur Express.js
4. Configurer les variables d'env
5. Activer SSL/HTTPS

**Guide complet** : [`GUIDE_DEPLOYMENT.md`](./GUIDE_DEPLOYMENT.md)

---

## 📈 Roadmap

### ✅ Terminé (v1.0)

- [x] Design system complet
- [x] Toutes les pages principales
- [x] Système de réservation HOLD/TTL
- [x] Paiements multi-providers
- [x] Géolocalisation
- [x] Stories Instagram-style
- [x] Système de publicités
- [x] Aide contextuelle
- [x] Multilingue (FR/EN/Mooré)
- [x] Documentation complète

### 🔜 À venir (v1.1+)

- [ ] Dashboard admin complet
- [ ] App mobile native (React Native)
- [ ] Programme de fidélité
- [ ] Recommandations IA
- [ ] Intégration WhatsApp
- [ ] Mode hors-ligne

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 License

Ce projet est sous licence MIT - voir le fichier [`LICENSE`](./LICENSE) pour plus de détails.

---

## 👥 Équipe

- **Product Owner** - Conception & stratégie
- **Lead Dev** - Architecture & développement
- **UI/UX Designer** - Interface & expérience utilisateur
- **Backend Dev** - API & base de données

---

## 📞 Support

- **Documentation** - Voir les fichiers `.md` dans le projet
- **Issues** - Ouvrir une issue sur GitHub
- **Email** - support@transportbf.com

---

## 🙏 Remerciements

- shadcn/ui pour les composants
- Lucide pour les icônes
- La communauté React/TypeScript
- Tous les contributeurs

---

**Fait avec ❤️ au Burkina Faso 🇧🇫**

---

**Dernière mise à jour** : 4 novembre 2025  
**Version** : 1.0.0
