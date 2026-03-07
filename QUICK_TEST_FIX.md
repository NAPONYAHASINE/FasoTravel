# 🎬 QUICK TEST - Vérifier la Correction

**Durée:** ~3 minutes

---

## ⚡ ÉTAPE 1: Lancer l'app Mobile

```bash
cd c:\FasoTravel\Mobile
npm run dev
```

**Output attendu:**
```
VITE v6.3.5 ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## ⚡ ÉTAPE 2: Ouvrir le navigateur

```
URL: http://localhost:5173
```

---

## ⚡ ÉTAPE 3: Trouver et Cliquer la Story avec Promo

**HOME PAGE:**
1. Chercher section **StoriesCircle** (cercles au top)
2. Voir 4 cercles avec emojis

**STORY À CLIQUER:**
- Titre: **"Réduction hiver 25%"**
- Emoji: 🎉
- Description: "Air Canada: -25% sur tous les trajets"

**Click cette story** ↓

---

## ⚡ ÉTAPE 4: Vérifier SearchResults

**RÉSULTAT ATTENDU** après story click:

```
URL: http://localhost:5173/search-results?promo_id=PROMO_001

Affichage:
┌─────────────────────────────┐
│ Trajets disponibles         │
│                             │
│ 🚗 2 trajets trouvés  ✅    │  ← AVANT: "0 trajet trouvé" ❌
│                             │
│ [Filters] [Promos] [Prix]   │
│                             │
│ ┌─────────────────────────┐ │
│ │ ✈️ Air Canada Bus       │ │
│ │ Ouaguadougou → Bobo     │ │
│ │ Prix: ~~8500~~ FCFA     │ │  ← Barré
│ │ Prix: 6375 FCFA     (✅)│ │  ← VERT
│ │ Badge: -25%            │ │  ← ROUGE
│ │ [Sélectionner]         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🚌 Scoot Express        │ │
│ │ Ouaguadougou → Bobo     │ │
│ │ Prix: ~~7000~~ FCFA     │ │  ← Barré
│ │ Prix: 5950 FCFA     (✅)│ │  ← VERT
│ │ Badge: -15%            │ │  ← ROUGE
│ │ [Sélectionner]         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## ⚡ ÉTAPE 5: Cliquer sur un Trajet

**Click:** [Sélectionner] sur "Air Canada Bus" ↓

**RÉSULTAT ATTENDU:**
```
Détails du trajet:
- Trajet: Ouaga → Bobo
- Prix: 6375 XOF (réduit)
- Billlets disponibles: 4+ ✅

Billets:
□ AC7H851941 - TRAORE Mamadou (6375 XOF)
□ AC7H851942 - DIALLO Fatoumata (6375 XOF)
□ AC7H851943 - KONE Ibrahim (6375 XOF)
□ AC7H851944 - SAWADOGO Antoine (6375 XOF)
```

---

## ✅ CHECKLIST DE VÉRIFICATION

```
ÉTAPE 1:
□ App Mobile lancée (Port 5173)    ✅

ÉTAPE 2:
□ HomePage charge                  ✅
□ StoriesCircle visible            ✅

ÉTAPE 3:
□ Story "Réduction hiver 25%" visible  ✅
□ Click story possible              ✅

ÉTAPE 4:
□ URL shows promo_id parameter      ✅
□ Affiche "2 trajets trouvés"      ✅ ← THIS IS THE FIX!
□ Air Canada visible                ✅
□ Scoot visible                     ✅
□ Prix réduit affiché (6375, 5950)  ✅
□ Badges "-25%" et "-15%" visibles  ✅

ÉTAPE 5:
□ Trajet click possible             ✅
□ Détails affichés                  ✅
□ 4 mock tickets visibles           ✅
□ Tous les prix = 6375 XOF          ✅
```

---

## 🎯 CE QUI A CHANGÉ

### LE BUG:
```typescript
// AVANT (SearchResultsPage line 64)
filter(trip => trip.promotion?.id === searchParams.promo_id)
                                ^--- WRONG FIELD!

// Promo n'a pas "id", a "promotion_id"!
// Donc aucune correspondance → 0 trajets
```

### LA FIX:
```typescript
// APRÈS (SearchResultsPage line 64)
filter(trip => trip.promotion?.promotion_id === searchParams.promo_id)
                                ^------ CORRECT FIELD!

// Maintenant ça match: promo_id PROMO_001 = PROMO_001
// 2 trajets affichés! ✅
```

---

## 🐛 SI VOUS NE VOYEZ TOUJOURS PAS 2 TRAJETS

### Problème 1: Cache
```
Ctrl+Shift+Del → Clear cache
Ou F12 → Network → uncheck "Disable cache"
```

### Problème 2: App pas reladée
```
Tuer terminal (Ctrl+C)
npm run dev
Reload navigateur (Ctrl+R)
```

### Problème 3: Vérifier le code
```
Ouvrir: Mobile/src/pages/SearchResultsPage.tsx
Ligne 64:
filter(trip => trip.promotion?.promotion_id === searchParams.promo_id)
           ← Doit avoir "promotion_id" pas "id"
```

---

## 📸 RÉSULTAT ATTENDU

**AVANT FIX:**
```
Étape 1 sur 4
Trajets disponibles

🚗 0 trajet trouvé  ❌
Aucun trajet disponible
```

**APRÈS FIX:**
```
Étape 1 sur 4
Trajets disponibles

🚗 2 trajets trouvés  ✅
✈️ Air Canada Bus - 6375 FCFA (-25%)
🚌 Scoot Express - 5950 FCFA (-15%)
```

---

**TEST COMPLETE!** 🎉

Si vous voyez "2 trajets trouvés", la correction fonctionne! ✅
