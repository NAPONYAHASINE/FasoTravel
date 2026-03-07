# 🎯 WORKFLOW PROMOTIONS & STORIES - IMPLÉMENTATION COMPLÈTE

**Date:** 28 février 2026  
**Status:** ✅ OPÉRATIONNEL  

---

## 📋 RÉSUMÉ DES MODIFICATIONS

### 1. **SOCIETE APP - Gestion des Stories avec Promotions**

#### ✅ Améliorations StoriesPage.tsx
```
- Ajout dropdown: Sélectionner une promotion existante
- Champ promo_id: Lier story à une promotion pour promo_story_id
- Approbation workflow: approval_status (draft → pending_validation → active/rejected)
- Support complet: Image + Vidéo + Promo + Call-to-Action
```

#### ✅ Mise àjour Story Interface
```typescript
interface Story {
  ...existant...
  promo_id?: string;  // 🆕 Lien optionnel vers une promotion
  approval_status: 'draft' | 'pending_validation' | 'active' | 'rejected'; // 🆕 Workflow validation
}
```

#### Workflow d'Approbation
```
1. Responsable crée Story dans StoriesPage:
   - Upload image/vidéo
   - Sélectionne une promotion (optionnel)
   - Définit dates/ciblage
   → Story créée avec approval_status: 'pending_validation'

2. Admin Societe approuve Story:
   - updateStory(id, { approval_status: 'active' })
   → Story active et visible sur Mobile

3. Backend synchronise:
   - Stories avec approval_status='active' + promo_id
   → Affichées sur Mobile dans StoriesCircle
   → Bridge vers SearchResults avec filtre promo_id
```

---

### 2. **MOBILE APP - Navigation depuis Stories**

#### ✅ StoriesCircle.tsx - Navigation Révisée
```typescript
// Logic tripartite:
if (story.promo_id) {
  // 🎯 Story liée à promotion
  → navigate('search-results', { promo_id: story.promo_id })
} else if (story.link_url) {
  // 🌐 Story avec lien externe
  → window.open(story.link_url)
} else {
  // ❌ Aucun lien
  → fermer simplement la story
}
```

#### ✅ SearchResultsPage.tsx - Filtre Promos
```
- Bouton "🎁 Promos": Filtre les trajets avec promotions
- Paramètre promo_id: Filtre par promotion spécifique (depuis story)
- Tri par réduction: Affiche % de réduction en badge
```

#### ✅ TripCard.tsx - Affichage Promotions
```
- Prix barré (base_price)
- Prix réduit en vert (promoted_price)
- Badge rouge: "X% de réduction"
```

---

### 3. **DESIGN - Correctifs Dark Mode**

#### ✅ PromotionsPage Fixes
```css
/* Avant (broken): */
bg-white text-gray-600

/* Après (fixed): */
bg-white dark:bg-gray-800
text-gray-600 dark:text-gray-400
border-gray-200 dark:border-gray-700

/* Select/Textarea: */
bg-white dark:bg-gray-700
text-gray-900 dark:text-white
border-gray-300 dark:border-gray-600
```

#### ✅ StoriesPage - Responsive Design OK
```
- Dropdowns avec dark support
- Inputs avec dark support
- Buttons avec contraste OK
```

---

## 🔄 FLUX COMPLET: DE LA PROMOTION À LA RÉSERVATION

### Scénario: "Réduction Air Canada 25%"

```
1️⃣ SOCIETE APP
   └─ Responsable crée Promotion:
      • Title: "Réduction hiver 25%"
      • discount_type: PERCENTAGE
      • discount_value: 25
      • status: active
      • promo_id: PROMO_001

2️⃣ SOCIETE APP
   └─ Responsable crée Story:
      • Title: "Réduction hiver ❄️"
      • Image: promo_banner.png
      • promo_id: PROMO_001 ← Liaison
      • approval_status: pending_validation

3️⃣ SOCIETE APP - ADMIN
   └─ Admin approuve Story:
      → updateStory(id, { approval_status: 'active' })

4️⃣ BACKEND SYNCHRONISE (future)
   └─ Story devient visible sur Mobile

5️⃣ MOBILE APP - HOME
   └─ User voit Story dans StoriesCircle
      • Clique surStory
      → StoriesCircle détecte promo_id
      → navigate('search-results', { promo_id: 'PROMO_001' })

6️⃣ MOBILE APP - SEARCH RESULTS
   └─ Affiche trajets avec PROMO_001 actifs:
      • Air Canada Ouaga → Bobo
      • Prix: 8500 FCFA (barré)
      • Prix réduit: 6375 FCFA (25%)
      • Badge: "-25%"

7️⃣ MOBILE APP - BOOKING
   └─ User clique "Réserver"
      → Sélectionne places
      → Confirme prix réduit 6375 FCFA
      → Paie et reçoit billet avec promo appliquée
```

---

## 📱 STRUCTURE DE DONNÉES

### Promotion (Snake_case - Backend Ready)
```typescript
{
  promotion_id: 'PROMO_001',
  operator_id: 'AIR_CANADA',
  title: 'Réduction hiver 25%',
  discount_type: 'PERCENTAGE',
  discount_value: 25,
  start_date: '2026-02-01',
  end_date: '2026-02-28',
  status: 'active',
  current_uses: 0,
  max_uses: 1000,
  created_by: 'resp_1'
}
```

### Story (Avec promo support)
```typescript
{
  id: 'story_promo_001',
  title: 'Réduction hiver ❄️',
  mediaUrl: 'image.png',
  mediaType: 'image',
  promo_id: 'PROMO_001', // ← Lien vers promotion
  approval_status: 'active', // ← Workflow validation
  targetValue: 'Air Canada',
  startDate: '2026-02-01',
  endDate: '2026-02-28',
  status: 'active'
}
```

### Trip (Avec promotion appliquée)
```typescript
{
  trip_id: 'TRIP_001',
  base_price: 8500,
  promotion: { ...promotionData },
  promoted_price: 6375,  // 8500 * 0.75
  discount_percentage: 25
}
```

---

## ✅ TEST MANUEL (Sans Backend)

### Pour tester le workflow complet:

1. **Societe: Créer Promotion**
   - Aller à: `/responsable/promotions`
   - Click "Nouvelle"
   - Title: "Test -20%"
   - Type: "PERCENTAGE", Valeur: 20
   - Status: "active"
   - Click "Créer"
   → Promo créée avec ID auto-généré

2. **Societe: Créer Story**
   - Aller à: `/responsable/stories`
   - Click "Nouvelle story"
   - Title: "Test Promotion"
   - Upload image
   - **Promotion associée:** Sélectionner "Test -20%"
   - Dates: Du 28/02 au 28/02
   - Click "Créer"
   → Story créée avec `promo_id` et `approval_status: pending_validation`

3. **ℹ️ Note sur Approbation**
   - Actuellement: Pas d'UI pour approver stories (TODO future)
   - Au lieu: Modifier DataContext pour mettre manuellement approval_status à 'active'
   - Ou: Quand backend connecté, admins auront page d'approbation

4. **Mobile: Voir Story**
   - App Mobile → HomePage
   - StoriesCircle: Voir "Test Promotion"
   - Click story
   → Redirige vers `/search-results?promo_id=PROMO_XXX`

5. **Mobile: Filtrer par Promo**
   - SearchResultsPage automatiquement affiche trajets avec cette promo
   - Filtre "🎁 Promos" toggle: montre seulement trajets promos
   - Affiche prix réduit + badge "-20%"

---

## 🔗 INTÉGRATION BACKEND

### Endpoints requis:
```
POST   /api/promotions              // Créer promo
GET    /api/promotions/:id          // Récupérer promo
PATCH  /api/promotions/:id          // Mettre à jour statut
DELETE /api/promotions/:id          // Supprimer

POST   /api/stories                 // Créer story
GET    /api/stories/active?approval_status=active  // Récupérer stories approuvées
PATCH  /api/stories/:id/approve     // Admin approuve story (sets approval_status=active)
```

### Data sync:
1. Mobile appelle `GET /api/stories/active`
2. Backend retourne stories avec `approval_status='active'` + `promo_id`
3. StoriesCircle affiche ces stories
4. User clique → SearchResults filtre par `promo_id`

---

## 📊 CHECKLIST QUALITÉ

- ✅ Zero duplication (calculatePromotionPrice helper)
- ✅ Backend-ready (snake_case partout)
- ✅ Design cohérent (dark mode OK)
- ✅ Workflow clair (création → approbation → publication)
- ✅ Type safety (TypeScript strict)
- ✅ Accessibility (aria-labels, keyboard navigation)
- ✅ Responsive (mobile-first)
- ✅ Additions only (aucune refactorisation existante)

---

## 🎯 PROCHAINES ÉTAPES

1. **Backend Development**
   - Implémenter endpoints promo & stories
   - Ajouter logic validation/approbation
   - Synchroniser stories approved avec Mobile

2. **Admin Approbation UI (Future)**
   - Page dédiée pour approver/rejeter stories
   - Bulk actions (activer/désactiver multiples)
   - Filtres (pending, active, rejected)

3. **Analytics (Future)**
   - Views/Clicks par story
   - Conversions promo → réservations
   - ROI par promotion

4. **Enhancements**
   - A/B testing de stories (2 versions)
   - Scheduling automatique (post à heure fixe)
   - Notifications push quand promo active

---

*Implémentation complète et testable sans backend*  
*Prêt pour intégration API*  
*Respecte toutes les règles de qualité*
