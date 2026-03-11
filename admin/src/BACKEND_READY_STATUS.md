# 🚀 FasoTravel Admin - Statut Backend Ready

**Date**: 19 février 2026  
**Version**: 2.0  
**Statut**: ✅ 100% Backend Ready

---

## 📊 Vue d'ensemble

L'application FasoTravel Admin est maintenant **complètement backend-ready** avec un système intelligent de basculement entre Mode Mock et Mode Production.

---

## ✅ Architecture Backend-Ready

### 1. **Configuration Centralisée** (`/config/app.config.ts`)

```typescript
import { AppConfig } from '@/config/app.config';

// Vérifier le mode actuel
if (AppConfig.isMock) {
  // Utiliser les données mock
}

// Basculer vers Production
AppConfig.setMode('production');

// Basculer entre les modes
AppConfig.toggleMode();
```

**Modes disponibles** :
- `mock` : Données factices, pas de backend requis
- `production` : Appels API réels vers le backend

---

### 2. **Services Métier** (`/services/entitiesService.ts`)

Tous les services implémentent automatiquement la logique de basculement :

```typescript
class TransportCompaniesService {
  async create(data: Partial<TransportCompany>): Promise<ApiResponse<TransportCompany>> {
    if (AppConfig.isMock) {
      // Logique Mock avec données locales
      return { success: true, data: mockData };
    }
    // Logique Production avec appels API
    return await apiService.post('/admin/companies', data);
  }
}
```

**Services disponibles** :
- ✅ `transportCompaniesService` - Gestion des sociétés
- ✅ `passengersService` - Gestion des passagers
- ✅ `stationsService` - Gestion des gares
- ✅ `supportService` - Support client
- ✅ `incidentsService` - Gestion des incidents
- ✅ `storiesService` - Stories
- ✅ `auditLogsService` - Audit logs
- ✅ `notificationsService` - Notifications

---

### 3. **API Client** (`/services/apiService.ts`)

Client HTTP unifié avec :
- ✅ Gestion d'authentification (Bearer token)
- ✅ Retry automatique en cas d'erreur 5xx
- ✅ Cache intelligent pour les GET
- ✅ Timeout configurable (30s)
- ✅ Upload de fichiers (FormData)

```typescript
// Requêtes standards
await apiService.get('/admin/companies');
await apiService.post('/admin/companies', data);
await apiService.put('/admin/companies/:id', data);
await apiService.delete('/admin/companies/:id');

// Upload de fichiers
await apiService.uploadFile('/admin/companies/:id/logo', formData);
```

---

### 4. **Upload de Logos** ⭐ NOUVEAU

Le système de téléchargement de logos est maintenant **100% backend-ready** :

#### Mode Mock :
```typescript
// Conversion automatique en base64
const handleLogoUpload = (file: File) => {
  const reader = new FileReader();
  reader.readAsDataURL(file); // Convertit en base64
};
```

#### Mode Production :
```typescript
// Upload vers le backend
await transportCompaniesService.uploadLogo(companyId, file);
// ⬇️ Appelle
// POST /admin/companies/:id/logo (FormData)
// ⬇️ Retourne
// { url: "https://cdn.fasotravel.bf/logos/company-123.png" }
```

**Avantages** :
- ✅ **Mock** : Pas besoin de serveur, base64 stocké localement
- ✅ **Production** : Upload optimisé, URL CDN retournée
- ✅ **Validation** : Type de fichier (images) + Taille max (2MB)
- ✅ **UX** : Aperçu en temps réel, boutons Changer/Supprimer

---

## 🎯 Points d'entrée Backend

Voici les endpoints que le backend doit implémenter :

### Companies (Sociétés de Transport)
```
GET    /admin/companies           - Liste toutes les sociétés
GET    /admin/companies/:id       - Récupère une société
POST   /admin/companies           - Crée une société
PUT    /admin/companies/:id       - Met à jour une société
DELETE /admin/companies/:id       - Supprime une société
POST   /admin/companies/:id/approve  - Approuve une société
POST   /admin/companies/:id/suspend  - Suspend une société
POST   /admin/companies/:id/logo     - Upload le logo (FormData)
```

### Passengers (Passagers)
```
GET    /admin/passengers          - Liste tous les passagers
GET    /admin/passengers/:id      - Récupère un passager
POST   /admin/passengers/:id/suspend    - Suspend un passager
POST   /admin/passengers/:id/reactivate - Réactive un passager
POST   /admin/passengers/:id/verify     - Vérifie un passager
```

### Stations (Gares)
```
GET    /admin/stations            - Liste toutes les gares
GET    /admin/stations/:id        - Récupère une gare
POST   /admin/stations            - Crée une gare
PUT    /admin/stations/:id        - Met à jour une gare
POST   /admin/stations/:id/toggle-status - Active/Désactive
```

### Support
```
GET    /admin/support             - Liste tous les tickets
GET    /admin/support/:id         - Récupère un ticket
POST   /admin/support/:id/assign  - Assigne un ticket
POST   /admin/support/:id/resolve - Résout un ticket
PATCH  /admin/support/:id         - Met à jour la priorité
```

### Audit Logs
```
GET    /admin/audit-logs          - Liste les logs d'audit
```

### Notifications
```
GET    /admin/notifications       - Liste les notifications
PATCH  /admin/notifications/:id/read - Marque comme lu
```

---

## 🔧 Configuration Backend Requise

### Variables d'environnement

Créer un fichier `.env` :

```bash
# Mode de l'application
VITE_APP_MODE=production  # ou 'mock'

# API Backend
VITE_API_BASE_URL=https://api.fasotravel.bf
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3

# Environnement
VITE_ENV=production  # ou 'development'
```

### Format de réponse API attendu

```typescript
// Succès
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie"
}

// Erreur
{
  "success": false,
  "error": "Message d'erreur",
  "statusCode": 400,
  "details": { ... }
}
```

---

## 🧪 Testing

### Tester en Mode Mock
```javascript
// Dans la console du navigateur
AppConfig.setMode('mock');
// L'app utilise maintenant les données factices
```

### Tester en Mode Production
```javascript
// Dans la console du navigateur
AppConfig.setMode('production');
// L'app fait maintenant des appels API réels
```

### Debug
```javascript
// Voir la configuration actuelle
console.log(AppConfig.config);

// Voir le mode
console.log(AppConfig.mode); // 'mock' ou 'production'
```

---

## 📝 Checklist Backend

Avant de passer en production, vérifier que :

- [ ] Tous les endpoints API sont implémentés
- [ ] L'authentification JWT fonctionne
- [ ] Les CORS sont configurés
- [ ] Le stockage des fichiers est configuré (logos)
- [ ] Les variables d'environnement sont définies
- [ ] Les logs d'audit sont persistés
- [ ] Les erreurs sont gérées correctement
- [ ] Les tests backend passent

---

## 🎉 Résultat

**Statut Backend Ready** : ✅ **100%**

L'application peut basculer instantanément entre Mock et Production sans aucune modification de code.

### Commandes utiles

```bash
# Démarrer en mode Mock (développement)
npm run dev

# Démarrer en mode Production
VITE_APP_MODE=production npm run dev

# Build pour production
npm run build
```

---

## 📞 Support

Pour toute question sur l'intégration backend :
- Documentation API : `/docs/api`
- Email : dev@fasotravel.bf
