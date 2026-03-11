# 🚀 Guide: Passer de MOCK à PRODUCTION

## 📌 Vue d'ensemble

L'application FasoTravel Admin utilise **actuellement des données MOCK**. Pour passer en PRODUCTION et utiliser le vrai backend, il suffit de **1 seule ligne de code**.

## ✅ État Actuel

### Mode MOCK (Développement)
- ✅ Toutes les données sont mockées
- ✅ Pas de backend requis
- ✅ Latence simulée (300ms)
- ✅ Données réalistes générées automatiquement

###Files configurés pour le switch:
- `/config/app.config.ts` - Configuration centralisée
- `/services/apiService.ts` - Service API avec switch mock/real
- `/services/financialService.ts` - Service financier mockable
- `/services/entitiesService.ts` - Services métier mockables

## 🔥 Comment Passer en PRODUCTION

### Méthode 1: Variable d'Environnement (RECOMMANDÉ)

**Créer/Modifier `.env` à la racine:**

```env
# Mode de l'application
REACT_APP_MODE=production

# URL du backend
REACT_APP_API_URL=https://api.fasotravel.bf/api
```

**C'est tout !** L'application détecte automatiquement le mode et switch vers le backend réel.

### Méthode 2: Code Direct

**Dans `/config/app.config.ts`:**

```typescript
// Changer la ligne 118:
const initialMode = 'production'; // Au lieu de 'mock'
```

### Méthode 3: Console Browser (Pour Tester)

**Ouvrir la console Chrome/Firefox et taper:**

```javascript
AppConfig.setMode('production')
```

**Pour revenir en MOCK:**

```javascript
AppConfig.setMode('mock')
```

## 🔍 Vérifier le Mode Actuel

### Dans la Console Browser:

```javascript
// Afficher le mode
console.log(AppConfig.mode); // 'mock' ou 'production'

// Vérifier si en mock
console.log(AppConfig.isMock); // true ou false

// Vérifier si en production
console.log(AppConfig.isProduction); // true ou false
```

### Au Démarrage de l'App:

L'application affiche automatiquement dans la console :

```
🧪 FasoTravel Admin - Mode: MOCK
⚠️ Attention: Vous utilisez des DONNÉES MOCK
💡 Pour passer en production: AppConfig.setMode("production")
```

Ou en production:

```
🚀 FasoTravel Admin - Mode: PRODUCTION
✅ Backend API: https://api.fasotravel.bf/api
```

## 📋 Checklist Avant la Production

### 1. Backend Prêt
- [ ] Tous les endpoints API sont implémentés
- [ ] CORS configuré pour le frontend
- [ ] SSL/TLS activé (HTTPS)
- [ ] Rate limiting configuré

### 2. Endpoints Backend Requis

**Sociétés de Transport:**
```
GET    /admin/companies
GET    /admin/companies/:id
POST   /admin/companies/:id/approve
POST   /admin/companies/:id/suspend
PUT    /admin/companies/:id
```

**Passagers:**
```
GET    /admin/passengers
GET    /admin/passengers/:id
POST   /admin/passengers/:id/suspend
POST   /admin/passengers/:id/reactivate
POST   /admin/passengers/:id/verify
```

**Stations:**
```
GET    /admin/stations
GET    /admin/stations/:id
POST   /admin/stations
PUT    /admin/stations/:id
POST   /admin/stations/:id/toggle-status
```

**Support:**
```
GET    /admin/support
GET    /admin/support/:id
POST   /admin/support/:id/assign
POST   /admin/support/:id/resolve
PATCH  /admin/support/:id
```

**Financier:**
```
POST   /admin/financial/metrics
GET    /admin/financial/daily-revenue
GET    /admin/financial/payment-methods
GET    /admin/financial/top-companies
```

### 3. Format des Réponses API

**Succès:**
```json
{
  "success": true,
  "data": { /* vos données */ },
  "message": "Success",
  "statusCode": 200
}
```

**Erreur:**
```json
{
  "success": false,
  "error": "Message d'erreur",
  "statusCode": 400
}
```

### 4. Authentification

**Le backend doit accepter:**
```
Authorization: Bearer <jwt_token>
```

**Token stocké dans:**
- localStorage ('auth_token')
- Géré automatiquement par `/services/apiService.ts`

## 🧪 Tester le Switch

### Test 1: Mode MOCK

```bash
# Dans .env
REACT_APP_MODE=mock

# Démarrer l'app
npm start

# Vérifier dans la console
# → "🧪 FasoTravel Admin - Mode: MOCK"
```

### Test 2: Mode PRODUCTION

```bash
# Dans .env
REACT_APP_MODE=production
REACT_APP_API_URL=https://api.fasotravel.bf/api

# Démarrer l'app
npm start

# Vérifier dans la console
# → "🚀 FasoTravel Admin - Mode: PRODUCTION"
```

### Test 3: Switch Dynamique

```javascript
// Dans la console browser

// Voir le mode actuel
AppConfig.mode; // 'mock'

// Passer en production
AppConfig.setMode('production');

// Vérifier
AppConfig.mode; // 'production'

// Basculer (toggle)
AppConfig.toggleMode();
```

## ⚠️ Points d'Attention

### 1. Données MOCK vs Données RÉELLES

**En MOCK:**
- Données stockées en mémoire
- Réinitialisation au refresh
- Génération aléatoire

**En PRODUCTION:**
- Données viennent du backend
- Persistance en base de données
- Données réelles

### 2. Performance

**En MOCK:**
- Latence simulée: 300ms
- Pas de réseau
- Instantané

**En PRODUCTION:**
- Latence réseau réelle
- Dépend de la connexion
- Cache de 5 min activé

### 3. Erreurs

**En MOCK:**
- Jamais d'erreurs réseau
- Toujours succès

**En PRODUCTION:**
- Erreurs 500, 404, 401, etc.
- Timeouts possibles
- Retry automatique (3 fois)

## 🎯 Workflow Recommandé

### Développement LOCAL:
```
MODE: mock
→ Pas de backend nécessaire
→ Développement rapide
```

### Staging/Test:
```
MODE: production
URL: https://api-staging.fasotravel.bf/api
→ Tester avec le vrai backend
→ Données de test
```

### Production:
```
MODE: production
URL: https://api.fasotravel.bf/api
→ Données réelles
→ Monitoring actif
```

## 📊 Monitoring du Mode

### Afficher un Banner en Mode MOCK

L'application affiche automatiquement un banner orange "MODE MOCK" si `AppConfig.config.debug.showMockBanner === true`.

Pour l'activer/désactiver, modifier `/config/app.config.ts`:

```typescript
const MOCK_CONFIG = {
  // ...
  debug: {
    logRequests: true,
    showMockBanner: true, // ← Affiche le banner
  },
};
```

## 🔐 Sécurité

### En Production:

1. **Désactiver les logs:**
```typescript
const PRODUCTION_CONFIG = {
  debug: {
    logRequests: false, // ← Pas de logs en prod
    showMockBanner: false,
  },
};
```

2. **HTTPS Obligatoire:**
```env
REACT_APP_API_URL=https://api.fasotravel.bf/api
# Pas de HTTP en production!
```

3. **Tokens sécurisés:**
- JWT avec expiration
- Refresh token
- HttpOnly cookies (optionnel)

## 🚀 Déploiement

### Build Production:

```bash
# Configurer .env.production
echo "REACT_APP_MODE=production" > .env.production
echo "REACT_APP_API_URL=https://api.fasotravel.bf/api" >> .env.production

# Build
npm run build

# Le build utilise automatiquement .env.production
```

### Docker:

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Variables d'environnement
ENV REACT_APP_MODE=production
ENV REACT_APP_API_URL=https://api.fasotravel.bf/api

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📞 Support

**Questions ?** Vérifier:
1. `/BACKEND_READY_GUIDE.md` - Architecture détaillée
2. `/config/app.config.ts` - Configuration
3. Console browser - Logs d'erreurs

---

**Date:** 2026-02-07  
**Version:** 2.0 - Switch MOCK/PRODUCTION  
**Auteur:** FasoTravel Dev Team
