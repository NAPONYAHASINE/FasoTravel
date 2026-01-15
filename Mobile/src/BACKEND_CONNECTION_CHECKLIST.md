# ✅ Checklist : Connexion Backend - Système de Publicités

## 🎯 Statut : PRÊT POUR LE BACKEND ✅

Le système de publicités est **100% prêt** à recevoir et communiquer avec votre backend !

---

## 📋 Ce qui est déjà en place (Frontend)

### ✅ Composant AdModal.tsx

**Fichier** : `/components/AdModal.tsx`

- [x] **Fetch API configuré** - Utilise `fetch()` natif
- [x] **Endpoints définis** - `/api/ads/active`, `/api/ads/:id/impression`, `/api/ads/:id/click`
- [x] **Headers configurés** - Content-Type, Authorization (si nécessaire)
- [x] **Gestion d'erreurs** - Try/catch sur toutes les requêtes
- [x] **Mode dev/prod** - Bascule automatique avec `shouldUseMock()`
- [x] **Tracking complet** - Impressions, clics, device type
- [x] **URL builder** - Construction d'URL avec query params

### ✅ Configuration centralisée

**Fichier** : `/lib/config.ts`

- [x] **API_ENDPOINTS** - Tous les endpoints centralisés
- [x] **ADS_CONFIG** - Configuration du système de pubs
- [x] **buildUrl()** - Helper pour construire les URLs
- [x] **shouldUseMock()** - Détection auto du mode
- [x] **getDefaultHeaders()** - Headers par défaut

### ✅ Intégration dans App.tsx

**Fichier** : `/App.tsx`

- [x] **AdModal importé** - Composant intégré
- [x] **User.id présent** - ID utilisateur disponible
- [x] **User.created_at présent** - Date création disponible
- [x] **isNewUser calculé** - Détection nouveaux users (< 7 jours)
- [x] **Pages configurées** - Liste des pages avec pubs

---

## 📦 Backend à déployer

### 1️⃣ Base de données (PostgreSQL)

**Fichier** : `/migrations/002_create_advertisements.sql`

```bash
# Exécuter la migration
psql -U postgres -d transportbf -f migrations/002_create_advertisements.sql
```

**Ce qui sera créé** :
- ✅ Table `advertisements` (annonces)
- ✅ Table `ad_impressions` (vues)
- ✅ Table `ad_clicks` (clics)
- ✅ Table `ad_conversions` (conversions)
- ✅ Vue `ad_analytics` (statistiques)
- ✅ Fonctions SQL (get_active_ads, increment_*, etc.)
- ✅ Index optimisés

### 2️⃣ Routes API (Express.js)

**Fichier** : `/backend-examples/advertisements-routes.js`

```bash
# Copier dans votre projet backend
cp backend-examples/advertisements-routes.js ./routes/
```

**Endpoints fournis** :

**Publics** :
- `GET /api/ads/active` - Récupère les annonces ciblées
- `POST /api/ads/:id/impression` - Track une vue
- `POST /api/ads/:id/click` - Track un clic
- `POST /api/ads/:id/conversion` - Track une conversion

**Admin** :
- `GET /api/admin/ads` - Liste toutes les annonces
- `POST /api/admin/ads` - Créer une annonce
- `PUT /api/admin/ads/:id` - Modifier une annonce
- `DELETE /api/admin/ads/:id` - Supprimer une annonce
- `GET /api/admin/ads/analytics/overview` - Stats globales
- `GET /api/admin/ads/:id/analytics` - Stats d'une annonce

---

## 🔧 Configuration pour passer en mode PROD

### Étape 1 : Variables d'environnement

Créer un fichier `.env` à la racine du projet frontend :

```env
# Mode de l'application
NODE_ENV=production

# URL de l'API backend
VITE_API_URL=https://api.transportbf.com

# Autres configs...
```

### Étape 2 : Activer le mode production

**Fichier** : `/lib/config.ts` (ligne 18)

```typescript
// DÉJÀ CONFIGURÉ ✅
// En prod, utilise automatiquement VITE_API_URL
export const API_BASE_URL = import.meta.env?.VITE_API_URL || 
  (isDevelopment ? 'http://localhost:3000' : '');
```

### Étape 3 : Désactiver les données mock

**Fichier** : `/lib/config.ts` (ligne 68)

```typescript
export const ADS_CONFIG = {
  // ...
  
  // Passer à false en production
  USE_MOCK_IN_DEV: false, // ⬅️ Changer ici
};
```

**OU** définir une variable d'environnement :

```env
VITE_USE_MOCK_DATA=false
```

Et modifier `/lib/config.ts` :

```typescript
USE_MOCK_IN_DEV: import.meta.env?.VITE_USE_MOCK_DATA !== 'false',
```

### Étape 4 : Rebuild l'application

```bash
npm run build
```

---

## 🧪 Tests de connexion Backend

### Test 1 : Vérifier que l'API est accessible

```bash
# Depuis un terminal
curl https://api.transportbf.com/api/ads/active?page=home

# Réponse attendue : []
# (tableau vide si aucune annonce, ou liste d'annonces)
```

### Test 2 : Vérifier dans le browser

```javascript
// Ouvrir DevTools Console
fetch('https://api.transportbf.com/api/ads/active?page=home')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Devrait afficher les annonces ou []
```

### Test 3 : Vérifier le tracking

```javascript
// Dans DevTools Console
fetch('https://api.transportbf.com/api/ads/TEST_AD_ID/impression', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    user_id: 'TEST_USER',
    page: 'home' 
  })
})
.then(r => r.json())
.then(console.log);

// Devrait retourner { success: true }
```

---

## 🔍 Debugging

### Problème : "Failed to fetch"

**Cause** : CORS non configuré sur le backend

**Solution** :

```javascript
// Dans votre serveur Express
const cors = require('cors');

app.use(cors({
  origin: ['https://transportbf.com', 'http://localhost:5173'],
  credentials: true
}));
```

### Problème : "404 Not Found"

**Cause** : Routes non déployées ou mauvais chemin

**Solution** :
- Vérifier que les routes sont importées dans le serveur
- Vérifier que l'URL de base est correcte dans `.env`

```javascript
// server.js
const adsRoutes = require('./routes/advertisements-routes');
app.use(adsRoutes); // ⬅️ Ne pas oublier !
```

### Problème : Les pubs ne s'affichent pas

**Causes possibles** :
1. Mode mock encore activé (`USE_MOCK_IN_DEV: true`)
2. Aucune annonce créée dans la DB
3. Annonces expirées (vérifier dates)
4. Fréquence trop récente (< 5 min depuis dernière pub)

**Debug** :

```javascript
// Dans AdModal.tsx, ajouter des console.log
console.log('Fetching ads with:', { currentPage, userId, isNewUser });
console.log('Should use mock?', shouldUseMock());
console.log('Ads received:', ads);
```

---

## 📊 Vérification de la base de données

### Vérifier les tables créées

```sql
-- Lister les tables
\dt

-- Devrait afficher :
-- advertisements
-- ad_impressions
-- ad_clicks
-- ad_conversions
```

### Vérifier qu'il y a des annonces

```sql
SELECT id, title, is_active, start_date, end_date 
FROM advertisements 
WHERE is_active = true;
```

### Créer une annonce de test

```sql
INSERT INTO advertisements (
  title,
  description,
  media_type,
  gradient,
  emoji,
  cta_text,
  action_type,
  internal_page,
  target_pages,
  priority,
  start_date,
  end_date,
  created_by
) VALUES (
  '🎉 Test Publicité',
  'Ceci est une annonce de test',
  'gradient',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '🧪',
  'Tester',
  'none',
  NULL,
  ARRAY['home'],
  10,
  NOW(),
  NOW() + INTERVAL '7 days',
  'ADMIN_USER_ID' -- ⬅️ Remplacer par un vrai ID
);
```

### Vérifier que l'annonce est retournée

```sql
SELECT * FROM get_active_ads('home', false);
```

---

## 📱 Test End-to-End

### Scénario complet

```
1. Créer une annonce dans la DB (SQL)
   ✅ Vérifier qu'elle est active
   
2. Démarrer le backend
   ✅ Routes accessibles
   ✅ CORS configuré
   
3. Configurer le frontend (.env)
   ✅ VITE_API_URL défini
   ✅ USE_MOCK_IN_DEV = false
   
4. Rebuild le frontend
   npm run build
   
5. Tester dans le browser
   ✅ Se connecter
   ✅ Aller sur HomePage
   ✅ Attendre 2 secondes
   ✅ Pub s'affiche !
   
6. Vérifier le tracking
   ✅ Ouvrir DevTools > Network
   ✅ Voir requête POST /api/ads/:id/impression
   ✅ Status 200 OK
   
7. Cliquer sur le CTA
   ✅ Voir requête POST /api/ads/:id/click
   ✅ Status 200 OK
   
8. Vérifier dans la DB
   SELECT * FROM ad_impressions ORDER BY timestamp DESC LIMIT 10;
   SELECT * FROM ad_clicks ORDER BY timestamp DESC LIMIT 10;
   ✅ Données présentes
```

---

## 🚀 Déploiement en production

### Checklist de déploiement

#### Backend

- [ ] Migration SQL exécutée sur DB de prod
- [ ] Routes déployées sur serveur
- [ ] CORS configuré pour domaine de prod
- [ ] Variables d'environnement configurées
- [ ] SSL/HTTPS activé
- [ ] Monitoring en place (logs, erreurs)

#### Frontend

- [ ] `.env` configuré avec URL de prod
- [ ] `USE_MOCK_IN_DEV` = false
- [ ] Build de production généré (`npm run build`)
- [ ] Déployé sur CDN/serveur
- [ ] HTTPS activé
- [ ] Test sur plusieurs navigateurs

#### Base de données

- [ ] Au moins 1 annonce créée pour test
- [ ] Backup configuré
- [ ] Index créés et optimisés
- [ ] Permissions configurées

#### Monitoring

- [ ] Analytics en place (Google Analytics, Mixpanel, etc.)
- [ ] Alertes configurées (erreurs, performance)
- [ ] Dashboard admin créé (optionnel mais recommandé)

---

## 📞 Support

### En cas de problème

1. **Vérifier les logs backend** - Erreurs API ?
2. **Vérifier DevTools Console** - Erreurs JavaScript ?
3. **Vérifier DevTools Network** - Requêtes réussies ?
4. **Vérifier la DB** - Annonces présentes et valides ?

### Documentation

- `/SYSTEME_PUBLICITES.md` - Doc complète du système
- `/RECAP_SYSTEME_PUBLICITES.md` - Guide rapide
- `/backend-examples/README.md` - Guide backend
- `/lib/config.ts` - Configuration centralisée

---

## ✅ Résumé

| Item | Statut | Notes |
|------|--------|-------|
| **Frontend prêt** | ✅ | AdModal.tsx configuré |
| **API endpoints définis** | ✅ | Dans config.ts |
| **Mode dev/prod** | ✅ | Bascule automatique |
| **Tracking configuré** | ✅ | Impressions + clics |
| **Migration SQL prête** | ✅ | À exécuter sur DB |
| **Routes backend prêtes** | ✅ | À déployer |
| **Documentation complète** | ✅ | 4 fichiers .md |

---

**Le système est prêt ! Il ne reste plus qu'à :**

1. ✅ Exécuter la migration SQL
2. ✅ Déployer les routes backend
3. ✅ Créer vos premières annonces
4. ✅ Configurer `.env` en prod
5. ✅ Rebuild et déployer

**Bonne chance ! 🚀**

---

**Dernière mise à jour** : 4 novembre 2025  
**Version** : 1.0.0  
**Auteur** : TransportBF Team
