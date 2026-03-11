# 🚀 Guide de Déploiement - FasoTravel Admin

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration des Environnements](#configuration-des-environnements)
3. [Build de Production](#build-de-production)
4. [Déploiement](#déploiement)
5. [Configuration Backend](#configuration-backend)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Prérequis

### Logiciels Requis
- **Node.js**: v18+ (recommandé: v20 LTS)
- **npm**: v9+ ou **yarn**: v1.22+
- **Git**: v2.30+

### Services Externes (Optionnel)
- **Sentry**: Pour error reporting
- **Google Analytics**: Pour analytics
- **CDN**: Cloudflare, AWS CloudFront, etc.

---

## ⚙️ Configuration des Environnements

### 1. Development (Local)

```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Éditer les variables
nano .env.local
```

**Configuration minimale**:
```env
VITE_MODE=development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_MOCK_DATA=true
VITE_LOG_LEVEL=debug
```

### 2. Staging (Preprod)

```bash
# Copier le fichier staging
cp .env.staging.example .env.staging

# Éditer avec les URLs staging
nano .env.staging
```

**Configuration requise**:
```env
VITE_MODE=staging
VITE_API_BASE_URL=https://api-staging.fasotravel.bf/api
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_ERROR_REPORTING=true
VITE_SENTRY_DSN=https://your-staging-sentry-dsn@sentry.io/xxx
```

### 3. Production

```bash
# Copier le fichier production
cp .env.production.example .env.production

# ⚠️ IMPORTANT: Configurer toutes les variables critiques
nano .env.production
```

**Configuration OBLIGATOIRE**:
```env
VITE_MODE=production
VITE_API_BASE_URL=https://api.fasotravel.bf/api  # ⚠️ À CONFIGURER
VITE_ENABLE_MOCK_DATA=false                       # ⚠️ CRITIQUE
VITE_ENABLE_ERROR_REPORTING=true
VITE_SENTRY_DSN=https://your-prod-sentry-dsn@sentry.io/xxx
VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
VITE_LOG_LEVEL=error
VITE_ENABLE_CONSOLE_LOGS=false
```

---

## 🏗️ Build de Production

### 1. Installation des Dépendances

```bash
# Avec npm
npm install --production=false

# Avec yarn
yarn install
```

### 2. Build pour Production

```bash
# Build avec le fichier .env.production
npm run build

# Ou spécifier l'environnement
NODE_ENV=production npm run build
```

### 3. Vérification du Build

```bash
# Tester le build localement
npm run preview

# Analyser la taille du bundle
npm run build -- --report
```

**Métriques attendues**:
- ✅ Bundle initial: < 700 KB (gzipped)
- ✅ Chunks par route: < 200 KB (gzipped)
- ✅ Build time: < 60s

---

## 🌐 Déploiement

### Option 1: Déploiement Statique (Recommandé)

#### Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel --prod

# Ou via GitHub (recommandé)
# 1. Connecter le repo à Vercel
# 2. Configurer les variables d'environnement
# 3. Push sur main → déploiement auto
```

**Variables Vercel**:
```
VITE_API_BASE_URL=https://api.fasotravel.bf/api
VITE_ENABLE_MOCK_DATA=false
VITE_SENTRY_DSN=...
```

#### Netlify

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Déployer
netlify deploy --prod

# Ou via Git
# 1. Connecter le repo à Netlify
# 2. Build command: npm run build
# 3. Publish directory: dist
```

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### AWS S3 + CloudFront

```bash
# 1. Build
npm run build

# 2. Upload vers S3
aws s3 sync dist/ s3://fasotravel-admin-prod --delete

# 3. Invalider le cache CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Option 2: Serveur avec Docker

**Dockerfile**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copier le build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration nginx pour SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss text/javascript;

    # Cache statique
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Déploiement Docker**:
```bash
# Build l'image
docker build -t fasotravel-admin:latest .

# Run localement
docker run -p 8080:80 fasotravel-admin:latest

# Push vers registry
docker tag fasotravel-admin:latest registry.example.com/fasotravel-admin:latest
docker push registry.example.com/fasotravel-admin:latest
```

---

## 🔌 Configuration Backend

### 1. Endpoints API Requis

L'application s'attend à ce que l'API backend expose ces endpoints:

```
# Authentication
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me

# Operators (Sociétés de Transport)
GET    /api/operators
POST   /api/operators
GET    /api/operators/:id
PUT    /api/operators/:id
DELETE /api/operators/:id

# Stations
GET    /api/stations
POST   /api/stations
GET    /api/stations/:id
PUT    /api/stations/:id
DELETE /api/stations/:id

# Users
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/users/:id/block

# ... (voir /services/endpoints.ts pour la liste complète)
```

### 2. CORS Configuration

Le backend doit autoriser les requêtes depuis le frontend:

```javascript
// Express.js exemple
app.use(cors({
  origin: [
    'http://localhost:5173',              // Dev
    'https://admin.fasotravel.bf',        // Prod
    'https://admin-staging.fasotravel.bf' // Staging
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 3. Authentication

**Format attendu**:

```javascript
// Login Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "admin@fasotravel.bf",
    "name": "Admin",
    "role": "super_admin"
  }
}

// Headers pour requêtes authentifiées
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Responses Format

**Success**:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error**:
```json
{
  "error": {
    "message": "Erreur de validation",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "email",
      "reason": "Email invalide"
    }
  }
}
```

---

## 📊 Monitoring

### 1. Sentry (Error Reporting)

```bash
# Installer Sentry
npm install @sentry/react @sentry/tracing
```

**Configuration** (déjà prévu, activer via .env):
```env
VITE_ENABLE_ERROR_REPORTING=true
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/xxx
```

### 2. Google Analytics

```env
VITE_ENABLE_ANALYTICS=true
VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
```

### 3. Logs Application

Les logs sont automatiquement gérés selon l'environnement:

- **Development**: Tous les logs (debug, info, warn, error)
- **Staging**: Info, warn, error
- **Production**: Error uniquement

**Vérifier les logs**:
```javascript
// Dans la console navigateur
window.__cacheMetrics() // Métriques du cache
```

---

## 🔧 Troubleshooting

### Problème: L'API ne répond pas

**Symptômes**: Erreurs CORS ou Network Error

**Solutions**:
1. Vérifier `VITE_API_BASE_URL` dans `.env`
2. Vérifier que le backend est démarré
3. Vérifier la configuration CORS du backend
4. Tester l'API directement: `curl https://api.fasotravel.bf/api/health`

### Problème: Build échoue

**Symptômes**: Erreurs TypeScript ou module not found

**Solutions**:
```bash
# Nettoyer les dépendances
rm -rf node_modules package-lock.json
npm install

# Vérifier la version Node
node -v  # Doit être v18+

# Build avec logs détaillés
npm run build -- --debug
```

### Problème: VITE_ENABLE_MOCK_DATA=false ne fonctionne pas

**Cause**: Variable mal formatée

**Solution**:
```env
# ❌ Incorrect
VITE_ENABLE_MOCK_DATA="false"

# ✅ Correct
VITE_ENABLE_MOCK_DATA=false
```

### Problème: Bundle trop gros

**Solutions**:
```bash
# Analyser le bundle
npm run build -- --analyze

# Vérifier que le code splitting est actif
# Tous les composants dashboard doivent être lazy-loadés
```

---

## ✅ Checklist de Déploiement

### Avant le Déploiement

- [ ] Tests passent: `npm test`
- [ ] Build réussit: `npm run build`
- [ ] `.env.production` configuré
- [ ] `VITE_ENABLE_MOCK_DATA=false` en production
- [ ] `VITE_API_BASE_URL` pointe vers l'API prod
- [ ] Sentry DSN configuré
- [ ] Google Analytics configuré (optionnel)

### Après le Déploiement

- [ ] Site accessible
- [ ] Login fonctionne
- [ ] API répond correctement
- [ ] Pas d'erreurs dans la console
- [ ] Performance Lighthouse > 90
- [ ] Sentry reçoit les erreurs
- [ ] Analytics fonctionne (optionnel)

---

## 📞 Support

**Documentation**: `/README.md`  
**Issues**: GitHub Issues  
**Email**: tech@fasotravel.bf

---

**Version**: 1.0.0  
**Dernière mise à jour**: 6 février 2026
