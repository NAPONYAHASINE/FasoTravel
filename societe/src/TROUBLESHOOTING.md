# 🔧 GUIDE DE RÉSOLUTION DES PROBLÈMES

## ✅ PROBLÈMES RÉSOLUS

### ❌ Erreur : `Cannot read properties of undefined (reading 'VITE_STORAGE_MODE')`

**Cause :** L'accès à `import.meta.env` pouvait échouer dans certains environnements.

**Solution appliquée :**
```typescript
// ❌ AVANT (fragile)
mode: import.meta.env.VITE_STORAGE_MODE || 'local'

// ✅ APRÈS (robuste)
const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    return import.meta.env?.[key] || defaultValue;
  } catch {
    return defaultValue;
  }
};

mode: getEnvVar('VITE_STORAGE_MODE', 'local')
```

**Fichiers modifiés :**
- `/services/config.ts` - Ajout de `getEnvVar()` helper
- `/services/storage/localStorage.service.ts` - Vérification disponibilité localStorage

---

## 🛡️ PROTECTIONS AJOUTÉES

### 1. **Vérification localStorage disponible**

Le service vérifie maintenant si `localStorage` est accessible avant chaque opération :

```typescript
class LocalStorageService {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 2. **Protection des headers**

Les headers n'essayent plus d'accéder à localStorage côté serveur :

```typescript
export const getDefaultHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // ✅ Vérification window disponible
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem(`${API_CONFIG.storagePrefix}auth_token`);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      // Ignorer silencieusement
    }
  }
  
  return headers;
};
```

### 3. **Retours par défaut sécurisés**

Toutes les méthodes retournent des valeurs par défaut sûres si `localStorage` n'est pas disponible :

```typescript
// Si localStorage n'est pas disponible
get() → retourne null
set() → retourne { success: false, error: 'localStorage non disponible' }
has() → retourne false
getSize() → retourne 0
export() → retourne '{}'
getStats() → retourne { totalSize: 0, keys: [] }
```

---

## 🧪 TESTER LA RÉSOLUTION

### **Test 1 : Vérifier que l'app se charge**

```bash
npm run dev
```

**Résultat attendu :** L'application se charge sans erreur.

### **Test 2 : Vérifier localStorage**

Ouvrez la console Chrome et tapez :

```javascript
// Vérifier que le service fonctionne
import { storageService } from './services/storage/localStorage.service';

// Devrait fonctionner
storageService.set('test', ['item1', 'item2']);
storageService.get('test'); // ['item1', 'item2']
```

### **Test 3 : Vérifier les logs**

Dans la console, vous devriez voir :

```
💾 Données sauvegardées { key: 'test', count: 2, size: '0.XX KB' }
📖 Données chargées { key: 'test', count: 2 }
```

---

## 🐛 AUTRES PROBLÈMES POTENTIELS

### **Problème : Les données ne se sauvegardent pas**

**Diagnostic :**
```javascript
// Dans la console
console.log('localStorage disponible ?', typeof localStorage !== 'undefined');
console.log('Peut écrire ?', localStorage.setItem('test', 'ok'));
console.log('Peut lire ?', localStorage.getItem('test'));
```

**Solutions :**
1. Vérifier que vous n'êtes pas en mode navigation privée
2. Vérifier que le localStorage n'est pas plein (quota dépassé)
3. Vérifier les permissions du navigateur

### **Problème : `import.meta.env` undefined dans les tests**

Si vous utilisez Jest/Vitest, configurez le mock :

```typescript
// vitest.config.ts ou jest.config.js
export default {
  define: {
    'import.meta.env.VITE_STORAGE_MODE': JSON.stringify('local'),
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3000/api'),
  },
};
```

### **Problème : "localStorage is not defined" en SSR**

C'est normal en Server-Side Rendering. Le code est maintenant protégé :

```typescript
if (typeof window !== 'undefined') {
  // Code qui utilise localStorage
}
```

---

## 📊 VÉRIFICATION DE SANTÉ

Exécutez cette fonction dans la console pour vérifier que tout fonctionne :

```javascript
function healthCheck() {
  const results = {
    localStorage: typeof localStorage !== 'undefined',
    storageService: true,
    canWrite: false,
    canRead: false,
  };
  
  try {
    localStorage.setItem('__health__', 'ok');
    results.canWrite = true;
    results.canRead = localStorage.getItem('__health__') === 'ok';
    localStorage.removeItem('__health__');
  } catch (e) {
    console.error('Erreur localStorage:', e);
  }
  
  console.table(results);
  
  return Object.values(results).every(v => v === true)
    ? '✅ Tout fonctionne !'
    : '⚠️ Des problèmes détectés';
}

healthCheck();
```

**Résultat attendu :**
```
┌─────────────────┬─────────┐
│ (index)         │ Values  │
├─────────────────┼─────────┤
│ localStorage    │ true    │
│ storageService  │ true    │
│ canWrite        │ true    │
│ canRead         │ true    │
└─────────────────┴─────────┘
✅ Tout fonctionne !
```

---

## 🔍 DEBUG AVANCÉ

### **Activer les logs détaillés**

Dans `/utils/logger.ts`, le niveau de log est configurable :

```typescript
// Pour voir TOUS les logs (debug inclus)
logger.setLevel('debug');

// Pour voir seulement les warnings et erreurs
logger.setLevel('warn');
```

### **Inspecter le localStorage**

Dans la console Chrome DevTools :
1. Ouvrir **Application** tab
2. Aller dans **Local Storage**
3. Voir toutes les clés `transportbf_*`

### **Nettoyer le localStorage**

```javascript
// Supprimer toutes les données de l'app
import { storageService } from './services/storage/localStorage.service';
storageService.clear();
```

---

## 🚨 ERREURS COURANTES ET SOLUTIONS

| Erreur | Cause | Solution |
|--------|-------|----------|
| `import.meta.env undefined` | Vite non configuré | ✅ Résolu avec `getEnvVar()` |
| `localStorage undefined` | Navigation privée / SSR | ✅ Résolu avec `checkAvailability()` |
| `QuotaExceededError` | localStorage plein (>5MB) | Nettoyer avec `storageService.clear()` |
| `SecurityError` | Cookies bloqués | Autoriser les cookies tiers |

---

## ✅ CHECKLIST DE VÉRIFICATION

- [x] L'app se charge sans erreur
- [x] `import.meta.env` est protégé
- [x] `localStorage` est vérifié avant utilisation
- [x] Les erreurs sont gérées silencieusement
- [x] Les logs sont clairs et utiles
- [x] Valeurs par défaut sûres partout

---

## 📞 SUPPORT

Si vous rencontrez toujours des problèmes :

1. **Vérifier la console** - Les logs sont très détaillés
2. **Exécuter `healthCheck()`** - Voir le diagnostic complet
3. **Vider le cache** - `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
4. **Tester en navigation privée** - Pour isoler les problèmes de cache

---

**Statut : ✅ Tous les problèmes connus sont résolus**

Date : 12 janvier 2025
