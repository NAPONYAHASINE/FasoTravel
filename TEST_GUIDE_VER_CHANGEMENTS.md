# 🎬 GUIDE TEST - Voir les Changements en Action

**Durée totale:** ~15 minutes pour démonstration complète

---

## 📱 TEST 1: Mock Tickets & Story → Booking Flow

### Étape 1: Lancer l'app Mobile
```bash
cd c:\FasoTravel\Mobile
npm run dev
# Output: VITE v6.3.5 ready in XXX ms
# URL: http://localhost:5173
```

### Étape 2: Naviguer jusqu'au Story via StoriesCircle
```
1. Ouvrir http://localhost:5173 en navigateur
2. Aller à: HomePage
3. Chercher "StoriesCircle" (section avec les cercles)
4. Cliquer sur n'importe quelle story (ex: "🎁 Promotion" ou histoire avec emoji)
```

### Étape 3: Vérifier Navigation Promo
```
1. Quand story s'ouvre:
   - Title: "Réduction hiver 25%" ou similaire
   - Button: "Voir les offres →" (NON "En savoir plus")
   
2. Click "Voir les offres →"
   - URL DOIT changer: http://localhost:5173/search-results?promo_id=PROMO_XXX
   - ✅ Preuve: promo_id est passé! ✅
```

### Étape 4: Vérifier Trajets Filtrés par Promo
```
1. SearchResultsPage s'affiche
2. Voir trajets filtrés:
   - TRIP_001: Air Canada Bus
     Prix: ~~8500~~ FCFA (barré)
     Prix réduit: 6375 FCFA (vert)
     Badge: "-25%"
   
   - TRIP_002: Scoot Express
     Prix: ~~7000~~ FCFA (barré)
     Prix réduit: 5950 FCFA (vert)
     Badge: "-15%"
     
   ✅ Preuve: Promos s'affichent! ✅
```

### Étape 5: Cliquer sur Trip → Voir Tickets
```
1. Click "TRIP_001: Air Canada Bus"
2. Page de détails s'affiche
3. Chercher section "Billets disponibles"
4. DOIT MONTRER:
   - ✅ AC7H851941 (TRAORE Mamadou, 6375 XOF)
   - ✅ AC7H851942 (DIALLO Fatoumata, 6375 XOF)
   - ✅ AC7H851943 (KONE Ibrahim, 6375 XOF)
   - ✅ AC7H851944 (SAWADOGO Antoine, 6375 XOF)
   
   TOTAL: 4 BILLETS POUR TRIP_001 ✅
```

### Étape 6: Vérifier Prix Réduits dans Tickets
```
Chaque ticket DOIT afficher:
- Prix: 6375 XOF (PAS 8500!)
- ✅ C'est le prix AVEC réduction 25% appliquée! ✅
```

---

## 🏢 TEST 2: Créer Story → Approuver Story (Societe)

### Étape 1: Lancer l'app Societe
```bash
cd c:\FasoTravel\societe
npm run dev
# URL: http://localhost:5174
```

### Étape 2: Créer Promotion d'abord
```
1. Login/Dashboard
2. Aller à: /responsable/promotions
3. Click "Nouvelle promotion"
4. Remplir:
   - Title: "Hiver 2026 -30%"
   - Type: PERCENTAGE
   - Value: 30
   - Dates: Valid dates
   - Status: active
5. Click "Créer"

✅ Promo créée avec ID auto-généré (ex: PROMO_1234)
```

### Étape 3: Créer Story AVEC Promo
```
1. Aller à: /responsable/stories
2. Click "Nouvelle story"
3. Remplir:
   - Title: "🎄 Promo Hiver LIVE"
   - Upload image/vidéo
   
   ⭐ IMPORTANT: Sélectionner "Promotion associée"
      Dropdown DOIT afficher: "Hiver 2026 -30%" ← Celle qu'on vient de créer
      Click select
   
4. Remplir autres champs (dates, etc.)
5. Click "Créer"

✅ Story créée!
```

### Étape 4: Vérifier Story en Section Approbation
```
1. Aller à: /responsable/stories (page principale)
2. CHERCHER SECTION JAUNE EN HAUT:

┌─────────────────────────────────────────────┐
│ ⏳ Stories en attente d'approbation (1)     │
├─────────────────────────────────────────────┤
│ 🎄 Promo Hiver LIVE                          │
│ 🎁 Liée à une promotion                      │
│                                              │
│  [✓ Approuver]  [✕ Rejeter]                 │
└─────────────────────────────────────────────┘

✅ SECTION VISIBLE = Changement FONCTIONNE! ✅
```

### Étape 5: Approuver Story
```
1. Click bouton "✓ Approuver"
2. Toast notification: "Story approuvée ! ✅"
3. Story DISPARAÎT de la section
4. Chercher la card dans la grille dessous
5. Vérifier le BADGE:
   - AVANT: "⏳ En attente" (jaune)
   - APRÈS: "✓ Approuvée" (vert)

✅ Approval workflow FONCTIONNE! ✅
```

---

## 🌙 TEST 3: Dark Mode Visibility

### Étape 1: Aller à PromotionsPage
```
1. App Societe toujours lancée
2. Aller à: /responsable/promotions
3. Voir page en LIGHT MODE
   ✅ Tous les éléments visibles (baseline)
```

### Étape 2: Toggle Dark Mode
```
1. Click toggle DARK MODE (bouton lune, haut droite)
2. Page passe en dark theme
3. VÉRIFIER tous les éléments:

​ ✅ En-têtes: BLANC sur fond sombre (lisibles)
✅ Texte: Blanc/gris clair (lisible)
✅ Cartes: Fond gris sombre, bordures visibles
✅ Inputs: Texte blanc sur fond gris (lisible)
✅ Selects: Lisibles
✅ Buttons: Contraste OK

❌ AVANT: Texte noir sur fond sombre = invisible
✅ APRÈS: Texte blanc sur fond sombre = visible!
```

### Étape 3: Remplir un Formulaire en Dark Mode
```
1. Click "Nouvelle promotion"
2. Remplir les champs:
   - Title input: ✅ Texte BLANC visible
   - Type select: ✅ Texte BLANC visible
   - Value input: ✅ Texte BLANC visible
   - Dates input: ✅ Lisibles
   - Description textarea: ✅ Lisible

✅ Tous les éléments LISIBLES en dark mode! ✅
```

---

## 📊 TEST 4: Promo Price Calculation

### Étape 1: Vérifier TRIP_001 (Promo 25%)
```
Base price: 8500 XOF
Discount: 25%
Calculation: 8500 * (1 - 0.25) = 8500 * 0.75 = 6375 ✅

Tickets en MOCK_TICKETS:
- AC7H851941: price = 6375 ✅
- AC7H851942: price = 6375 ✅
- AC7H851943: price = 6375 ✅
- AC7H851944: price = 6375 ✅
```

### Étape 2: Vérifier TRIP_002 (Promo 15%)
```
Base price: 7000 XOF
Discount: 15%
Calculation: 7000 * (1 - 0.15) = 7000 * 0.85 = 5950 ✅

Tickets en MOCK_TICKETS:
- SC9K1234AC: price = 5950 ✅
- SC9K1234AD: price = 5950 ✅
- SC9K1234AE: price = 5950 ✅
```

---

## ✅ CHECKLIST TEST COMPLÈTE

```
MOBILE APP:
□ Story displayed in StoriesCircle
□ Click story avec promo_id
□ URL: search-results?promo_id=XXX ✅
□ Trajets filtrés par promo
□ Prix original barré
□ Prix réduit en vert
□ Badge "-25%" ou "-15%" visible
□ Click trip → voir 4+ tickets
□ Tickets affichent prix réduit (6375 ou 5950)

SOCIETE APP:
□ Créer promotion OK
□ Créer story OK
□ Dropdown promotions affiche promo créée
□ Story s'ajoute à section d'approbation jaune
□ Section titre: "Stories en attente d'approbation (1)"
□ Story s'affiche avec promo link indicator "🎁 Liée à une promotion"
□ Click "✓ Approuver"
□ Toast: "Story approuvée ! ✅" ✅
□ Badge change de "⏳ En attente" à "✓ Approuvée"
□ Story disparaît de section d'approbation

DARK MODE:
□ Aller à /promotions
□ Toggle dark mode
□ All text readable (white/light gray)
□ All cards visible (dark gray background)
□ All form inputs readable (white text)
□ All selects readable
□ All buttons with good contrast
```

---

## 🐛 Si quelque chose ne s'affiche pas:

### 1. Vérifier que les apps sont relancées
```bash
# Tuer les serveurs existants (Ctrl+C dans terminal)
# Relancer:

cd c:\FasoTravel\Mobile
npm run dev

cd c:\FasoTravel\societe
npm run dev
```

### 2. Vérifier le cache navigateur
```
Ctrl+Shift+Del → Clear cache and cookies
OU
Dev Tools (F12) → Application → Clear Site Data
```

### 3. Vérifier les fichiers dans VS Code
```
Chercher "AC7H851941" dans Mobile/src/data/models.ts
Chercher "Stories en attente d'approbation" dans societe/src/pages/responsable/StoriesPage.tsx
Chercher "promo_id?: string" dans societe/src/contexts/DataContext.tsx
```

---

## 📞 Question: "Pourquoi je ne vois pas les changements?"

### Réponses possibles:

1. **L'app n'est pas relancée → npm run dev**
2. **Cache navigateur → Ctrl+Shift+Del**
3. **Fichiers pas modifiés → Contrôler dans VS Code (voir fichiers ci-dessus)**
4. **Branch GIT → Vérifier être sur branche correcte**

---

## ✨ TEMPS ESTIMÉ PAR TEST

```
Test 1 (Mobile tickets): 5-7 minutes
Test 2 (Societe story): 5-7 minutes
Test 3 (Dark mode): 2-3 minutes
Test 4 (Prices): 2-3 minutes

TOTAL: ~15 minutes pour voir TOUS les changements en action! ✅
```

---

**Après ces tests, vous aurez PROUVE visuellement que:**
- ✅ 7 mock tickets existent pour trajets promos
- ✅ Stories peuvent être liées à promotions
- ✅ Workflow d'approbation fonctionne
- ✅ Dark mode est entièrement fonctionnel
- ✅ Prix réduits s'affichent correctement
