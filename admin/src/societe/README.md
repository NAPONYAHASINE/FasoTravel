# 🏢 FasoTravel Societe - Admin Dashboard

**Version:** 1.0.0  
**Date:** 30 janvier 2026  
**Type:** Application Admin migrée

---

## 🎯 Qu'est-ce que c'est ?

Cette application est l'**interface d'administration** de FasoTravel, destinée aux opérateurs de transport :

- **Responsables** : Vision globale, gestion complète du système
- **Managers** : Gestion d'une gare spécifique
- **Caissiers** : Vente de billets et gestion de caisse

---

## 📁 Structure

```
societe/
├─ src/
│  ├─ pages/
│  │  ├─ Login.tsx              ← Page de connexion
│  │  └─ Dashboard.tsx          ← Dashboard principal
│  │
│  ├─ contexts/
│  │  └─ AppContext.tsx         ← Context React (utilise @shared)
│  │
│  ├─ App.tsx                   ← Composant principal
│  ├─ main.tsx                  ← Point d'entrée
│  └─ index.css                 ← Styles globaux
│
├─ package.json
├─ vite.config.ts
└─ tsconfig.json
```

---

## 🚀 Lancer l'application

### 1. Installer les dépendances

```bash
cd societe
npm install
```

### 2. Configurer l'environnement

```bash
cp .env.example .env

# Éditer .env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_MOCK_DATA=true
```

### 3. Démarrer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

---

## 🔐 Comptes de test

### Responsable (Accès complet)
- **Email:** admin@tsr.bf
- **Mot de passe:** Pass123!
- **Rôle:** responsable
- **Accès:** Toutes les données du système

### Manager (Gestion de gare)
- **Email:** manager@gare-ouaga.bf
- **Mot de passe:** Pass123!
- **Rôle:** manager
- **Accès:** Données de la gare de Ouagadougou

### Caissier (Vente de billets)
- **Email:** caissier@gare-ouaga.bf
- **Mot de passe:** Pass123!
- **Rôle:** caissier
- **Accès:** Vente de billets, gestion de caisse

---

## 🔧 Utilisation de la couche Shared

### Import des types

```typescript
// ✅ CORRECT - Import depuis @shared
import { OperatorUser, Trip, Ticket } from '@shared/types';

// ❌ INCORRECT - Ne PAS créer de types locaux
import { Trip } from '../types';  // ❌
```

### Utilisation de apiClient

```typescript
// ✅ CORRECT - Via AppContext
import { useApp } from '../contexts/AppContext';

function MyComponent() {
  const { trips, createTrip } = useApp();
  // AppContext utilise apiClient de @shared en interne
}

// ✅ CORRECT - Import direct (si nécessaire)
import { apiClient } from '@shared/services';

const trips = await apiClient.get<Trip[]>('/trips');
```

### Utilisation des validators

```typescript
// ✅ CORRECT
import { isValidEmail, getPasswordError } from '@shared/utils';

const emailError = isValidEmail(email);
```

### Utilisation des formatters

```typescript
// ✅ CORRECT
import { formatCurrency, formatDate } from '@shared/utils';

const price = formatCurrency(50000); // "50 000 F CFA"
const date = formatDate('2026-01-30'); // "30/01/2026"
```

---

## 📦 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarrer le serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualiser le build |
| `npm run lint` | Linter le code |

---

## 🎨 Design System

### Couleurs Burkina Faso

```css
/* Couleurs principales */
--color-fasotravel-red: #dc2626
--color-fasotravel-yellow: #f59e0b
--color-fasotravel-green: #16a34a
```

### Classes Tailwind personnalisées

```tsx
// Bouton avec dégradé Burkina
<button className="bg-gradient-to-r from-fasotravel-red via-fasotravel-yellow to-fasotravel-green">
  Action
</button>

// Couleurs individuelles
<div className="text-fasotravel-red">Texte rouge</div>
<div className="bg-fasotravel-yellow">Fond jaune</div>
<div className="border-fasotravel-green">Bordure verte</div>
```

---

## 🔄 Migration depuis l'ancienne structure

### Changements principaux

| Avant | Après |
|-------|-------|
| `/components/Dashboard.tsx` | `/societe/src/pages/Dashboard.tsx` |
| `/components/Login.tsx` | `/societe/src/pages/Login.tsx` |
| `/context/AppContext.tsx` | `/societe/src/contexts/AppContext.tsx` |
| `/services/api.ts` | ✅ Utilise `@shared/services/apiClient` |
| `/types/index.ts` | ✅ Utilise `@shared/types` |

### Imports modifiés

```typescript
// AVANT
import { apiClient } from '../services/api';
import { Trip, Ticket } from '../types';

// APRÈS
import { apiClient } from '@shared/services';
import { Trip, Ticket } from '@shared/types';
```

---

## ⚠️ Règles importantes

### ❌ Ne JAMAIS faire

```typescript
// ❌ Ne PAS dupliquer les types
export interface Trip { ... }  // ❌ INTERDIT

// ❌ Ne PAS créer un autre client HTTP
const client = axios.create({ ... });  // ❌ INTERDIT

// ❌ Ne PAS appeler fetch() directement
fetch('/api/trips');  // ❌ INTERDIT
```

### ✅ Toujours faire

```typescript
// ✅ Importer depuis @shared
import { Trip } from '@shared/types';
import { apiClient } from '@shared/services';

// ✅ Utiliser AppContext
import { useApp } from '../contexts/AppContext';
const { trips, createTrip } = useApp();

// ✅ Réutiliser les formatters
import { formatCurrency } from '@shared/utils';
```

---

## 📚 Documentation

- **Spec complète :** `/SYSTEM_COMPLETE_SPECIFICATION.md`
- **Plan de migration :** `/PLAN_MIGRATION_COMPLET.md`
- **Phase 1 terminée :** `/SHARED_LAYER_COMPLETE.md`
- **Documentation Shared :** `/shared/README.md`

---

## 🐛 Debugging

### Mode développement

```typescript
// apiClient log automatiquement les requêtes en dev
[API Request] GET /trips
[API Response] /trips { data: [...] }
[API Error] VALIDATION_ERROR: Email invalide
```

### Variables d'environnement

```bash
# Activer les logs détaillés
VITE_LOG_LEVEL=debug

# Mode mock (sans backend)
VITE_ENABLE_MOCK_DATA=true

# URL de l'API
VITE_API_URL=http://localhost:3000/api
```

---

## 🚀 Prochaines étapes (Phase 3)

1. ✅ Phase 1 : Shared layer créé
2. ✅ Phase 2 : Migration Societe/ (EN COURS)
3. ⏳ Phase 3 : Créer Mobile/ (app passagers)
4. ⏳ Phase 4 : Backend API complet
5. ⏳ Phase 5 : Intégration & Tests
6. ⏳ Phase 6 : Déploiement production

---

**Auteur:** FasoTravel Team  
**Date:** 30 janvier 2026  
**Statut:** ✅ PHASE 2 EN COURS
