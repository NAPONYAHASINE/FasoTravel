# 🔧 Exemples Backend - TransportBF

Ce dossier contient des exemples de code backend pour implémenter les fonctionnalités avancées de TransportBF.

## 📁 Contenu

### 1. `operator-stories-routes.js`
**Système de stories Instagram-style pour les compagnies**

- **Framework:** Express.js (Node.js)
- **Base de données:** PostgreSQL
- **Endpoints:**
  - GET /api/operators/:id/stories - Récupérer les stories
  - POST /api/operators/:id/stories/:storyId/view - Marquer comme vu
  - POST /api/admin/operators/:id/stories - Créer une story (admin)
  - DELETE /api/admin/operators/:id/stories/:storyId - Supprimer (admin)

### 2. `advertisements-routes.js`
**Système de publicités interstitielles pour monétisation**

- **Framework:** Express.js (Node.js)
- **Base de données:** PostgreSQL
- **Endpoints publics:**
  - GET /api/ads/active - Annonces actives ciblées
  - POST /api/ads/:id/impression - Tracker une vue
  - POST /api/ads/:id/click - Tracker un clic
  - POST /api/ads/:id/conversion - Tracker une conversion
- **Endpoints admin:**
  - GET /api/admin/ads - Liste toutes les annonces
  - POST /api/admin/ads - Créer une annonce
  - PUT /api/admin/ads/:id - Modifier une annonce
  - DELETE /api/admin/ads/:id - Supprimer une annonce
  - GET /api/admin/ads/analytics/overview - Stats globales
  - GET /api/admin/ads/:id/analytics - Analytics d'une annonce

## 🚀 Utilisation rapide

### 1. Installation

```bash
npm install express pg jsonwebtoken cors
```

### 2. Configuration

Créer un fichier `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/transportbf
JWT_SECRET=your-super-secret-key-change-this
NODE_ENV=development
```

### 3. Intégration dans votre app

```javascript
const express = require('express');
const cors = require('cors');
const operatorRoutes = require('./backend-examples/operator-stories-routes');
const adsRoutes = require('./backend-examples/advertisements-routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use(operatorRoutes);
app.use(adsRoutes);

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
```

### 4. Tester

```bash
# Lancer le serveur
node app.js

# Dans un autre terminal, tester les endpoints
# Stories
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/operators/AIR_CANADA/stories

# Publicités
curl http://localhost:3000/api/ads/active?page=home&is_new=false
```

## 🗄️ Migrations SQL

Les fichiers SQL de migration se trouvent dans `/migrations/` :

### `001_create_operator_stories.sql`
- Tables: `operator_stories`, `story_views`
- Fonctions: `mark_story_as_viewed()`, `cleanup_expired_stories()`
- Indexes optimisés

### `002_create_advertisements.sql`
- Tables: `advertisements`, `ad_impressions`, `ad_clicks`, `ad_conversions`
- Fonctions: `get_active_ads()`, `increment_ad_impressions()`, `increment_ad_clicks()`
- Vue: `ad_analytics` (statistiques)

**Exécution:**
```bash
psql -U postgres -d transportbf -f migrations/001_create_operator_stories.sql
psql -U postgres -d transportbf -f migrations/002_create_advertisements.sql
```

## 📚 Adaptation pour d'autres frameworks

### Express.js → Fastify

```javascript
// Fastify version
fastify.get('/api/ads/active', async (request, reply) => {
  const { page, is_new } = request.query;
  
  const result = await pool.query(/* ... */);
  reply.send(result.rows);
});
```

### Express.js → NestJS

```typescript
// NestJS version
@Controller('ads')
export class AdsController {
  @Get('active')
  async getActiveAds(
    @Query('page') page: string,
    @Query('is_new') isNew: boolean
  ) {
    // ...
  }
}
```

### PostgreSQL → MySQL

```javascript
// Remplacer les placeholders
// PostgreSQL: $1, $2, $3
const pgQuery = 'SELECT * FROM ads WHERE id = $1';

// MySQL: ?, ?
const mysqlQuery = 'SELECT * FROM ads WHERE id = ?';

// ON CONFLICT (PostgreSQL) → INSERT IGNORE (MySQL)
```

## 🔐 Génération de JWT (pour tests)

```javascript
const jwt = require('jsonwebtoken');

// Générer un token de test
const token = jwt.sign(
  { 
    user_id: 'USER_123',
    email: 'test@example.com',
    isAdmin: true
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Token:', token);
```

## 🧪 Tests automatisés

### Avec Jest + Supertest

```javascript
const request = require('supertest');
const app = require('../app');

describe('Advertisements API', () => {
  let authToken;
  
  beforeAll(() => {
    authToken = generateTestToken();
  });
  
  describe('GET /api/ads/active', () => {
    it('should return targeted ads', async () => {
      const res = await request(app)
        .get('/api/ads/active?page=home');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
  
  describe('POST /api/admin/ads', () => {
    it('should create new ad (admin only)', async () => {
      const adData = {
        title: 'Test Ad',
        description: 'Test description',
        media_type: 'gradient',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        action_type: 'none',
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
      
      const res = await request(app)
        .post('/api/admin/ads')
        .set('Authorization', `Bearer ${authToken}`)
        .send(adData);
      
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
    });
  });
});
```

## 📊 Monitoring & Logs

### Avec Winston

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

// Utilisation dans les routes
router.post('/api/ads/:id/click', async (req, res) => {
  try {
    logger.info('Ad clicked', { 
      adId: req.params.id,
      userId: req.body.user_id,
      page: req.body.page
    });
    // ...
  } catch (error) {
    logger.error('Error tracking click', { 
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ error: 'Internal error' });
  }
});
```

## 🚀 Performance

### Avec Redis (cache)

```javascript
const redis = require('redis');
const client = redis.createClient();

router.get('/api/ads/active', async (req, res) => {
  const cacheKey = `ads:active:${req.query.page}`;
  
  // Essayer le cache
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Sinon, requête DB
  const result = await pool.query(/* ... */);
  
  // Mettre en cache (5 minutes)
  await client.setex(cacheKey, 300, JSON.stringify(result.rows));
  
  res.json(result.rows);
});
```

## 📝 Notes importantes

1. **Sécurité**
   - Ne jamais commit le `.env` avec de vraies clés
   - Changer `JWT_SECRET` en production
   - Valider toutes les entrées utilisateur
   - Utiliser HTTPS en production
   - Sanitiser les données pour éviter SQL injection

2. **Performance**
   - Ajouter des index sur les colonnes fréquemment requêtées
   - Utiliser un pool de connexions DB
   - Mettre en cache les résultats fréquents
   - Paginer les résultats si > 100 items
   - Optimiser les requêtes avec EXPLAIN ANALYZE

3. **Maintenance**
   - Logger toutes les erreurs
   - Monitorer les temps de réponse
   - Nettoyer les stories expirées régulièrement (cron)
   - Archiver les vieilles impressions/clics
   - Sauvegarder la DB quotidiennement

4. **Publicités**
   - Respecter les limites de fréquence (anti-spam)
   - Désactiver automatiquement les annonces expirées
   - Archiver les stats après 90 jours
   - Monitorer le CTR pour détecter les problèmes
   - A/B testing pour optimiser les performances

## 📖 Documentation complète

Pour plus de détails, consultez:
- `/SYSTEME_PUBLICITES.md` - Doc complète du système de pubs
- `/BACKEND_API_STORIES.md` - Doc complète du système de stories
- `/BACKEND_CHECKLIST.md` - Checklist d'implémentation
- `/GUIDE_DEPLOYMENT.md` - Guide de déploiement

## 📞 Support

Pour toute question:
- Consulter la documentation dans `/` (fichiers .md)
- Ouvrir une issue GitHub
- Contacter l'équipe dev

---

**Dernière mise à jour:** 4 novembre 2025  
**Version:** 1.0.0
