# 🚀 Guide de Déploiement - TransportBF

## Vue d'ensemble

Ce guide vous accompagne pour déployer TransportBF en production avec un vrai backend.

---

## 📋 Prérequis

- [ ] Backend API fonctionnel avec les endpoints documentés
- [ ] Base de données PostgreSQL/MySQL configurée
- [ ] Compte Vercel/Netlify pour le frontend (gratuit)
- [ ] (Optionnel) Compte Supabase pour backend clé en main

---

## 🔧 Étape 1: Préparer le Backend

### A. Créer les tables de base de données

Exécutez les scripts SQL dans cet ordre:

```sql
-- 1. Table des opérateurs
CREATE TABLE operators (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo VARCHAR(50),
  logo_url VARCHAR(500),
  vehicle_image_url VARCHAR(500),
  rating DECIMAL(2,1),
  total_trips INT DEFAULT 0,
  description TEXT,
  amenities JSON,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des stories des opérateurs
CREATE TABLE operator_stories (
  id VARCHAR(255) PRIMARY KEY,
  operator_id VARCHAR(255) NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  media_type VARCHAR(20) NOT NULL,
  media_url VARCHAR(500),
  gradient VARCHAR(100),
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(150),
  description TEXT,
  emoji VARCHAR(10),
  cta_text VARCHAR(50),
  cta_link VARCHAR(500),
  duration_seconds INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_operator_expires (operator_id, expires_at)
);

-- 3. Table des vues de stories
CREATE TABLE story_views (
  user_id VARCHAR(255) NOT NULL,
  story_id VARCHAR(255) NOT NULL REFERENCES operator_stories(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, story_id),
  INDEX idx_user (user_id),
  INDEX idx_story (story_id)
);

-- 4. Table des utilisateurs
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- 5. Table des stations/gares
CREATE TABLE stations (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  address TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 6. Table des trajets
CREATE TABLE trips (
  id VARCHAR(255) PRIMARY KEY,
  operator_id VARCHAR(255) REFERENCES operators(id),
  from_station_id VARCHAR(255) REFERENCES stations(id),
  to_station_id VARCHAR(255) REFERENCES stations(id),
  departure_time TIMESTAMP,
  arrival_time TIMESTAMP,
  base_price DECIMAL(10,2),
  vehicle_type VARCHAR(100),
  amenities JSON,
  has_live_tracking BOOLEAN DEFAULT false
);

-- 7. Table des réservations
CREATE TABLE bookings (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  trip_id VARCHAR(255) REFERENCES trips(id),
  status VARCHAR(20), -- 'HOLD', 'PAID', 'CANCELLED'
  seat_number VARCHAR(10),
  price DECIMAL(10,2),
  hold_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP
);

-- 8. Table des moyens de paiement
CREATE TABLE payment_methods (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100),
  type VARCHAR(50),
  provider VARCHAR(50),
  logo VARCHAR(500),
  enabled BOOLEAN DEFAULT true,
  min_amount DECIMAL(10,2),
  max_amount DECIMAL(10,2),
  fees_percentage DECIMAL(5,2)
);
```

### B. Implémenter les endpoints

Consultez `/BACKEND_API_STORIES.md` pour les détails des endpoints des stories.

Endpoints minimums requis:
- ✅ `GET /operators` - Liste des opérateurs
- ✅ `GET /operators/:id` - Détails d'un opérateur
- ✅ `GET /operators/:id/stories` - Stories d'un opérateur
- ✅ `POST /operators/:id/stories/:story_id/view` - Marquer story vue
- ✅ `GET /stations` - Liste des gares
- ✅ `GET /trips` - Recherche de trajets
- ✅ `POST /bookings/hold` - Créer réservation HOLD
- ✅ `POST /bookings/confirm` - Confirmer paiement
- ✅ `GET /tickets` - Mes billets

### C. Configurer l'authentification JWT

```javascript
// Exemple avec Node.js + Express + JWT
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    { 
      user_id: user.id, 
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
```

---

## 🌐 Étape 2: Configurer le Frontend

### A. Cloner et installer

```bash
# Cloner le projet
git clone https://github.com/your-repo/transportbf.git
cd transportbf

# Installer les dépendances
npm install
```

### B. Configurer les variables d'environnement

Créer un fichier `.env` à la racine:

```env
# Mode production
VITE_MODE=production

# URL de votre API backend
VITE_API_URL=https://api.transportbf.com

# Autres configs (optionnel)
VITE_GOOGLE_MAPS_API_KEY=your-key-here
```

### C. Modifier le fichier `/lib/api.ts`

Changer la ligne 29:

```typescript
// AVANT (développement)
const isDevelopment = import.meta.env?.MODE === 'development' || true;

// APRÈS (production)
const isDevelopment = import.meta.env?.MODE === 'development';
```

**Important:** Cette ligne permet au frontend de basculer automatiquement entre:
- Données mockées en développement
- Vraies requêtes API en production

### D. Tester localement

```bash
# Build de production
npm run build

# Prévisualiser
npm run preview
```

Vérifier que:
- ✅ Les stories apparaissent correctement
- ✅ Le cercle coloré s'affiche sur les logos
- ✅ Les compteurs de stories sont exacts
- ✅ Le tracking des vues fonctionne

---

## ☁️ Étape 3: Déployer sur Vercel

### A. Créer un compte Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Se connecter avec GitHub
3. Importer le repository TransportBF

### B. Configurer les variables d'environnement

Dans Vercel Dashboard:
1. Settings > Environment Variables
2. Ajouter:
   ```
   VITE_MODE = production
   VITE_API_URL = https://api.transportbf.com
   ```

### C. Déployer

```bash
# Avec Vercel CLI (optionnel)
npm install -g vercel
vercel --prod
```

Ou simplement:
1. Push sur GitHub
2. Vercel déploie automatiquement

---

## 🔒 Étape 4: Sécuriser

### A. Configurer CORS sur le backend

```javascript
// Express.js exemple
const cors = require('cors');

app.use(cors({
  origin: [
    'https://transportbf.com',
    'https://www.transportbf.com',
    'http://localhost:5173' // Dev local
  ],
  credentials: true
}));
```

### B. Ajouter des rate limits

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requêtes par IP
});

app.use('/api/', limiter);
```

### C. Valider les données entrantes

```javascript
// Exemple avec Joi
const Joi = require('joi');

const storyViewSchema = Joi.object({
  user_id: Joi.string().required(),
  story_id: Joi.string().required()
});
```

---

## 📊 Étape 5: Monitoring & Analytics

### A. Configurer Sentry (tracking d'erreurs)

```bash
npm install @sentry/react
```

Dans `/App.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_MODE,
  tracesSampleRate: 1.0,
});
```

### B. Ajouter Google Analytics

Dans `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXX');
</script>
```

### C. Logs backend

Utiliser Winston ou Pino pour logger:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 🧪 Étape 6: Tests en Production

### Checklist de vérification:

#### Stories des compagnies:
- [ ] Les logos affichent le cercle coloré si stories non vues
- [ ] Le cercle devient gris après avoir tout regardé
- [ ] Le compteur de stories est correct
- [ ] Le modal plein écran s'ouvre au clic
- [ ] La navigation gauche/droite fonctionne
- [ ] L'auto-progression fonctionne (5 secondes)
- [ ] Le tracking des vues est enregistré
- [ ] Les stories expirées n'apparaissent pas

#### Autres fonctionnalités:
- [ ] Recherche de trajets fonctionne
- [ ] Réservation HOLD (10 min TTL)
- [ ] Paiement avec Orange Money / Moov Money
- [ ] Géolocalisation et gares à proximité
- [ ] QR Code des billets s'affiche
- [ ] Transfert de billets
- [ ] Annulation jusqu'à 1h avant départ

---

## 🐛 Débogage Commun

### Problème: Stories ne s'affichent pas

**Solutions:**
1. Vérifier que `isDevelopment = false` dans `/lib/api.ts`
2. Vérifier la console pour les erreurs réseau
3. Tester l'endpoint manuellement: `GET /operators/AIR_CANADA/stories`
4. Vérifier que `expires_at` est dans le futur

### Problème: Cercle coloré ne s'affiche jamais

**Solutions:**
1. Vérifier que le backend renvoie `has_unread_stories: true`
2. Vérifier que `stories_count > 0`
3. Tester la requête SQL des compteurs (voir `/BACKEND_API_STORIES.md`)

### Problème: Tracking des vues ne fonctionne pas

**Solutions:**
1. Vérifier l'authentification JWT
2. Vérifier que `user_id` est dans le token
3. Tester manuellement: `POST /operators/:id/stories/:story_id/view`
4. Vérifier les logs backend

---

## 📈 Optimisations Post-Déploiement

### 1. Mettre en cache les compteurs de stories

Utiliser Redis:

```javascript
const redis = require('redis');
const client = redis.createClient();

// Cacher les compteurs pendant 5 minutes
async function getOperatorStoriesCount(operatorId, userId) {
  const cacheKey = `stories:${operatorId}:${userId}`;
  const cached = await client.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  // Sinon, requête DB
  const data = await db.query(/* ... */);
  await client.setex(cacheKey, 300, JSON.stringify(data));
  return data;
}
```

### 2. CDN pour les médias

Utiliser Cloudinary ou S3 + CloudFront:

```javascript
// Upload automatique vers Cloudinary
const cloudinary = require('cloudinary').v2;

const result = await cloudinary.uploader.upload(file, {
  folder: 'transportbf/stories',
  transformation: [
    { width: 720, height: 1280, crop: 'fill' },
    { quality: 'auto', fetch_format: 'auto' }
  ]
});

const media_url = result.secure_url;
```

### 3. Compression des images

Utiliser Sharp pour optimiser:

```javascript
const sharp = require('sharp');

await sharp(inputFile)
  .resize(720, 1280, { fit: 'cover' })
  .webp({ quality: 80 })
  .toFile(outputFile);
```

---

## 🔄 Mise à jour Continue

### Git Workflow recommandé:

```bash
# Créer une branche pour chaque feature
git checkout -b feature/admin-stories-dashboard

# Développer et tester
# ...

# Push et créer une Pull Request
git push origin feature/admin-stories-dashboard

# Après review, merger dans main
# Vercel déploie automatiquement
```

---

## 📞 Support

**Documentation:**
- `/PREPARATION_BACKEND_COMPLETE.md` - Vue d'ensemble backend
- `/BACKEND_API_STORIES.md` - API détaillée des stories
- `/guidelines/Guidelines.md` - Standards de code

**Besoin d'aide?**
- Issues GitHub: [github.com/transportbf/issues](https://github.com/transportbf/issues)
- Email: dev@transportbf.com

---

**Dernière mise à jour:** 4 novembre 2025
**Version:** 1.0.0
