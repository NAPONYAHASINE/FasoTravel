# ✅ Checklist Backend - Stories des Compagnies

## Vue d'ensemble

Cette checklist vous guide pour implémenter le système de stories des compagnies de transport dans votre backend.

**Temps estimé:** 4-6 heures pour un développeur backend expérimenté

---

## 📦 Phase 1: Base de données (1h)

### Tables à créer

- [ ] **Table `operator_stories`**
  ```sql
  - id (PK)
  - operator_id (FK -> operators.id)
  - type (VARCHAR: PROMO, NEW_ROUTE, ANNOUNCEMENT, EVENT, ACHIEVEMENT)
  - media_type (VARCHAR: image, video, gradient)
  - media_url (VARCHAR, nullable)
  - gradient (VARCHAR, nullable)
  - title (VARCHAR 100, NOT NULL)
  - subtitle (VARCHAR 150, nullable)
  - description (TEXT, nullable)
  - emoji (VARCHAR 10, nullable)
  - cta_text (VARCHAR 50, nullable)
  - cta_link (VARCHAR 500, nullable)
  - duration_seconds (INT, default 5)
  - created_at (TIMESTAMP)
  - expires_at (TIMESTAMP, NOT NULL)
  ```

- [ ] **Table `story_views`**
  ```sql
  - user_id (VARCHAR, NOT NULL)
  - story_id (FK -> operator_stories.id)
  - viewed_at (TIMESTAMP)
  - PRIMARY KEY (user_id, story_id)
  ```

### Index à créer

- [ ] Index sur `operator_stories(operator_id, expires_at)` pour performance
- [ ] Index sur `operator_stories(expires_at)` pour nettoyage
- [ ] Index sur `story_views(user_id)` pour requêtes utilisateur
- [ ] Index sur `story_views(story_id)` pour statistiques

### Contraintes

- [ ] Foreign key `operator_id` -> `operators(id)` ON DELETE CASCADE
- [ ] Foreign key `story_id` -> `operator_stories(id)` ON DELETE CASCADE
- [ ] Check constraint sur `type` (valeurs autorisées uniquement)
- [ ] Check constraint sur `media_type` (valeurs autorisées uniquement)
- [ ] Check constraint `expires_at > created_at`

---

## 🔌 Phase 2: Endpoints API (2-3h)

### Endpoint 1: GET /operators/{operator_id}/stories

- [ ] **Route créée** (ex: `/api/operators/:operatorId/stories`)
- [ ] **Authentification JWT** vérifiée
- [ ] **Filtrage des stories expirées** (`WHERE expires_at > NOW()`)
- [ ] **Jointure avec `story_views`** pour calculer `is_viewed`
- [ ] **Tri par date** (`ORDER BY created_at DESC`)
- [ ] **Gestion d'erreurs:**
  - [ ] 404 si opérateur introuvable
  - [ ] 401 si token invalide
  - [ ] 500 si erreur serveur

**SQL de référence:**
```sql
SELECT 
  os.*,
  CASE 
    WHEN sv.viewed_at IS NOT NULL THEN true 
    ELSE false 
  END as is_viewed
FROM operator_stories os
LEFT JOIN story_views sv 
  ON sv.story_id = os.id 
  AND sv.user_id = ?
WHERE os.operator_id = ?
  AND os.expires_at > NOW()
ORDER BY os.created_at DESC;
```

**Test:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/operators/AIR_CANADA/stories
```

---

### Endpoint 2: POST /operators/{operator_id}/stories/{story_id}/view

- [ ] **Route créée** (ex: `/api/operators/:operatorId/stories/:storyId/view`)
- [ ] **Authentification JWT** vérifiée
- [ ] **Validation** que la story existe et n'est pas expirée
- [ ] **Insert dans `story_views`** avec gestion des doublons (ON CONFLICT)
- [ ] **Réponse 200** avec `{ success: true }`
- [ ] **Gestion d'erreurs:**
  - [ ] 404 si story introuvable
  - [ ] 410 si story expirée
  - [ ] 401 si token invalide

**SQL de référence:**
```sql
-- PostgreSQL
INSERT INTO story_views (user_id, story_id, viewed_at)
VALUES (?, ?, NOW())
ON CONFLICT (user_id, story_id) DO NOTHING;

-- MySQL
INSERT IGNORE INTO story_views (user_id, story_id, viewed_at)
VALUES (?, ?, NOW());
```

**Test:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/operators/AIR_CANADA/stories/AC_STORY_1/view
```

---

### Endpoint 3: GET /operators (modification)

- [ ] **Ajouter les champs** `stories_count` et `has_unread_stories`
- [ ] **Jointures avec `operator_stories` et `story_views`**
- [ ] **Filtrage** des stories actives uniquement
- [ ] **Groupement** par opérateur avec COUNT
- [ ] **Calcul** de `has_unread_stories` par utilisateur

**SQL de référence:**
```sql
SELECT 
  o.*,
  COUNT(DISTINCT os.id) as stories_count,
  CASE 
    WHEN COUNT(DISTINCT os.id) > COUNT(DISTINCT sv.story_id) 
    THEN true 
    ELSE false 
  END as has_unread_stories
FROM operators o
LEFT JOIN operator_stories os 
  ON os.operator_id = o.id 
  AND os.expires_at > NOW()
LEFT JOIN story_views sv 
  ON sv.story_id = os.id 
  AND sv.user_id = ?
WHERE o.is_active = true
GROUP BY o.id
ORDER BY o.name;
```

**Test:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/operators
```

**Vérifier dans la réponse:**
```json
{
  "id": "AIR_CANADA",
  "name": "Air Canada Bus",
  "stories_count": 3,
  "has_unread_stories": true
}
```

---

## 🔐 Phase 3: Authentification (30min)

### JWT Token

- [ ] **Middleware d'authentification** créé
- [ ] **Extraction du token** depuis header `Authorization: Bearer ...`
- [ ] **Vérification** de la signature JWT
- [ ] **Extraction** du `user_id` depuis le payload
- [ ] **Attachement** de `req.user` pour les routes protégées

**Code exemple (Express.js):**
```javascript
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user; // { user_id, email }
    next();
  });
}

// Utilisation
app.get('/api/operators/:id/stories', authenticateToken, getOperatorStories);
```

---

## 🧹 Phase 4: Nettoyage automatique (30min)

### Cron Job pour supprimer les stories expirées

- [ ] **Script de nettoyage** créé
- [ ] **Planification** (ex: toutes les heures via cron)
- [ ] **Suppression** des stories expirées depuis > 7 jours
- [ ] **Logging** des suppressions

**Code exemple (Node.js + node-cron):**
```javascript
const cron = require('node-cron');

// Tous les jours à 3h du matin
cron.schedule('0 3 * * *', async () => {
  console.log('🧹 Nettoyage des stories expirées...');
  
  const result = await db.query(`
    DELETE FROM operator_stories 
    WHERE expires_at < NOW() - INTERVAL '7 days'
  `);
  
  console.log(`✅ ${result.rowCount} stories supprimées`);
});
```

**Vérification:**
```bash
# Vérifier les logs après 24h
tail -f logs/cleanup.log
```

---

## 🧪 Phase 5: Tests (1h)

### Tests unitaires

- [ ] **Test**: Récupérer stories actives seulement
- [ ] **Test**: Marquer une story comme vue
- [ ] **Test**: Pas de doublons dans `story_views`
- [ ] **Test**: `is_viewed` correct après marquage
- [ ] **Test**: `has_unread_stories` correct
- [ ] **Test**: 401 sans authentification
- [ ] **Test**: 404 pour opérateur inexistant

**Exemple avec Jest:**
```javascript
describe('GET /operators/:id/stories', () => {
  it('should return only non-expired stories', async () => {
    // Créer une story expirée
    await createStory({ expires_at: '2020-01-01' });
    
    // Créer une story active
    await createStory({ expires_at: '2030-01-01' });
    
    const res = await request(app)
      .get('/api/operators/AIR_CANADA/stories')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});
```

### Tests d'intégration

- [ ] **Scénario complet**: Créer story → Récupérer → Marquer vue → Vérifier
- [ ] **Test multi-utilisateurs**: 2 users voient les mêmes stories différemment

### Tests de charge

- [ ] **Perf**: 100 requêtes simultanées < 200ms
- [ ] **Perf**: 1000 stories par opérateur ne ralentit pas l'API

---

## 📊 Phase 6: Statistiques (optionnel, 1h)

### Endpoint: GET /operators/{operator_id}/stories/stats

- [ ] **Nombre de vues** par story
- [ ] **Taux de complétion** (vues / impressions)
- [ ] **Top stories** les plus vues

**SQL exemple:**
```sql
SELECT 
  os.title,
  COUNT(sv.user_id) as total_views,
  os.created_at,
  os.expires_at
FROM operator_stories os
LEFT JOIN story_views sv ON sv.story_id = os.id
WHERE os.operator_id = ?
GROUP BY os.id
ORDER BY total_views DESC
LIMIT 10;
```

---

## 🎨 Phase 7: Dashboard Admin (optionnel, 3-4h)

### Endpoints admin

- [ ] `POST /admin/operators/:id/stories` - Créer une story
- [ ] `PUT /admin/operators/:id/stories/:story_id` - Modifier
- [ ] `DELETE /admin/operators/:id/stories/:story_id` - Supprimer
- [ ] `GET /admin/operators/:id/stories` - Liste avec stats

### Upload de médias

- [ ] **Intégration Cloudinary** ou S3
- [ ] **Validation** du type de fichier (image/video)
- [ ] **Redimensionnement** automatique (720x1280)
- [ ] **Compression** WebP

**Code exemple (Cloudinary):**
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadStoryMedia(file) {
  const result = await cloudinary.uploader.upload(file, {
    folder: 'transportbf/stories',
    transformation: [
      { width: 720, height: 1280, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
  return result.secure_url;
}
```

---

## 🚀 Déploiement

### Prérequis

- [ ] **Variables d'environnement** configurées:
  ```
  DATABASE_URL=postgresql://...
  JWT_SECRET=your-secret-key
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...
  ```

- [ ] **CORS** configuré pour accepter le frontend:
  ```javascript
  app.use(cors({
    origin: 'https://transportbf.com',
    credentials: true
  }));
  ```

- [ ] **Rate limiting** activé:
  ```javascript
  const rateLimit = require('express-rate-limit');
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  }));
  ```

### Monitoring

- [ ] **Logs** centralisés (Winston, Pino)
- [ ] **Sentry** pour tracking d'erreurs
- [ ] **Uptime monitoring** (UptimeRobot, Pingdom)
- [ ] **Métriques** (temps de réponse, taux d'erreur)

---

## 📝 Documentation finale

- [ ] **Swagger/OpenAPI** doc générée
- [ ] **README** avec exemples de requêtes
- [ ] **Variables d'env** documentées
- [ ] **Guide de déploiement** écrit

---

## ✅ Checklist de validation finale

Avant de déclarer le système prêt pour la production:

### Fonctionnel
- [ ] Les stories apparaissent dans le frontend
- [ ] Les cercles colorés s'affichent correctement
- [ ] Le tracking des vues fonctionne
- [ ] Les compteurs sont exacts
- [ ] Les stories expirées disparaissent

### Performance
- [ ] Temps de réponse < 200ms pour GET /operators/:id/stories
- [ ] Pas de N+1 queries
- [ ] Index DB créés et utilisés
- [ ] Cache Redis optionnel implémenté

### Sécurité
- [ ] JWT validé sur tous les endpoints
- [ ] SQL injection impossible (prepared statements)
- [ ] CORS configuré strictement
- [ ] Rate limiting activé
- [ ] Logs ne contiennent pas de données sensibles

### Robustesse
- [ ] Gestion d'erreurs complète
- [ ] Tests passent à 100%
- [ ] Rollback possible en cas d'erreur
- [ ] Backup DB automatique

---

## 🎯 Résumé

**Durée totale estimée:** 4-6h pour l'essentiel, 8-10h avec admin et stats

**Priorités:**
1. ✅ **Phase 1-3** (Base de données + Endpoints de base) - **CRITIQUE**
2. ✅ **Phase 4** (Nettoyage automatique) - **IMPORTANT**
3. ✅ **Phase 5** (Tests) - **IMPORTANT**
4. 🔜 **Phase 6-7** (Stats + Admin) - **NICE TO HAVE**

**Fichiers de référence:**
- `/BACKEND_API_STORIES.md` - Documentation API détaillée
- `/PREPARATION_BACKEND_COMPLETE.md` - Vue d'ensemble
- `/GUIDE_DEPLOYMENT.md` - Guide de déploiement
- `/data/models.ts` - Types TypeScript de référence

**Support:**
Si vous bloquez, contactez l'équipe frontend avec:
1. Message d'erreur complet
2. Requête SQL problématique
3. Payload de la requête HTTP
4. Logs backend

---

**Bonne chance! 🚀**

Dernière mise à jour: 4 novembre 2025
