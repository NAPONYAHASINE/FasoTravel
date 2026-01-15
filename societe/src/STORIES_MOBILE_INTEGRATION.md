# 📱 Guide d'intégration Stories - App Mobile FasoTravel

## 📋 Vue d'ensemble

Le système de stories du dashboard responsable est 100% prêt pour l'intégration avec l'app mobile. Ce document explique la structure des données et comment gérer les interactions utilisateur.

---

## 🔌 Structure de données Story

### Interface TypeScript (référence)
```typescript
interface Story {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  duration: number; // Durée d'affichage en secondes
  
  // Ciblage
  targeting: 'all' | 'route' | 'city' | 'station';
  targetValue?: string; // Nom de la ligne, ville, ou ID gare
  targetStations?: string[]; // IDs des gares (optionnel)
  
  // Call-to-Action
  actionType?: 'none' | 'book_route' | 'view_company';
  actionLabel?: string; // Texte du bouton CTA
  
  // Métadonnées
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  views: number;
  clicks: number;
  status: 'active' | 'scheduled' | 'expired';
  createdAt: string; // ISO 8601
  createdBy?: string;
  createdByName?: string;
}
```

---

## 📦 Exemple JSON complet

```json
{
  "id": "story_001",
  "title": "Promotion Noël -30% Ouaga-Bobo",
  "mediaUrl": "https://storage.supabase.co/stories/promo_noel.mp4",
  "mediaType": "video",
  "duration": 15,
  
  "targeting": "route",
  "targetValue": "Ouagadougou - Bobo-Dioulasso",
  
  "actionType": "book_route",
  "actionLabel": "Réserver maintenant",
  
  "startDate": "2024-12-20T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "views": 12543,
  "clicks": 1876,
  "status": "active",
  "createdAt": "2024-12-15T10:30:00Z",
  "createdBy": "resp_001",
  "createdByName": "TSR Transport"
}
```

---

## 🎯 Logique de ciblage (Filtrage côté mobile)

### 1. **Tous les utilisateurs** (`targeting: 'all'`)
```javascript
// Afficher à tous les utilisateurs
if (story.targeting === 'all') {
  showStory(story);
}
```

### 2. **Ligne spécifique** (`targeting: 'route'`)
```javascript
// Afficher seulement si l'utilisateur consulte cette ligne
if (story.targeting === 'route' && story.targetValue === currentRoute) {
  showStory(story);
}

// Exemple: story.targetValue = "Ouagadougou - Bobo-Dioulasso"
```

### 3. **Ville spécifique** (`targeting: 'city'`)
```javascript
// Afficher si l'utilisateur est dans cette ville (géolocalisation)
// OU s'il recherche des trajets depuis/vers cette ville
if (story.targeting === 'city' && 
    (userCity === story.targetValue || searchedCity === story.targetValue)) {
  showStory(story);
}

// Exemple: story.targetValue = "Ouagadougou"
```

### 4. **Station spécifique** (`targeting: 'station'`)
```javascript
// Afficher si l'utilisateur est proche de la gare (géolocalisation)
if (story.targeting === 'station' && 
    story.targetStations?.includes(userCurrentStation)) {
  showStory(story);
}
```

---

## 🎬 Gestion de l'affichage média

### Images
```javascript
if (story.mediaType === 'image') {
  // Afficher l'image pendant story.duration secondes
  <Image 
    source={{ uri: story.mediaUrl }} 
    style={styles.storyMedia}
  />
  
  // Auto-avance après story.duration secondes
  setTimeout(() => nextStory(), story.duration * 1000);
}
```

### Vidéos
```javascript
if (story.mediaType === 'video') {
  // Lire la vidéo (durée automatique)
  <Video 
    source={{ uri: story.mediaUrl }}
    onEnd={() => nextStory()}
    resizeMode="cover"
    style={styles.storyMedia}
  />
  
  // La durée est celle de la vidéo (story.duration pour info seulement)
}
```

---

## 🔘 Gestion des Call-to-Action

### 1. **Aucune action** (`actionType: 'none'` ou absent)
```javascript
// Pas de bouton CTA à afficher
if (!story.actionType || story.actionType === 'none') {
  return null;
}
```

### 2. **Réserver une ligne** (`actionType: 'book_route'`)
```javascript
if (story.actionType === 'book_route') {
  // Afficher le bouton
  <TouchableOpacity onPress={() => handleBookRoute(story)}>
    <Text>{story.actionLabel || "Réserver"}</Text>
  </TouchableOpacity>
}

function handleBookRoute(story) {
  // Incrémenter le compteur de clics
  incrementStoryClicks(story.id);
  
  // Navigation vers la recherche avec pré-remplissage
  navigation.navigate('Search', {
    route: story.targetValue, // Ex: "Ouagadougou - Bobo-Dioulasso"
    fromStory: true
  });
}
```

### 3. **Voir la compagnie** (`actionType: 'view_company'`)
```javascript
if (story.actionType === 'view_company') {
  // Afficher le bouton
  <TouchableOpacity onPress={() => handleViewCompany(story)}>
    <Text>{story.actionLabel || "Voir nos trajets"}</Text>
  </TouchableOpacity>
}

function handleViewCompany(story) {
  // Incrémenter le compteur de clics
  incrementStoryClicks(story.id);
  
  // Navigation vers la page de la compagnie
  navigation.navigate('CompanyProfile', {
    companyId: story.createdBy, // ID du responsable/compagnie
    fromStory: true
  });
}
```

---

## 📊 Tracking des métriques

### Incrémenter les vues
```javascript
// Quand une story est affichée à l'utilisateur
async function trackStoryView(storyId) {
  await supabase
    .from('stories')
    .update({ views: views + 1 })
    .eq('id', storyId);
}
```

### Incrémenter les clics
```javascript
// Quand l'utilisateur clique sur le bouton CTA
async function incrementStoryClicks(storyId) {
  await supabase
    .from('stories')
    .update({ clicks: clicks + 1 })
    .eq('id', storyId);
}
```

---

## 🔍 Récupération des stories actives

### Query Supabase
```javascript
// Récupérer toutes les stories actives
const { data: stories } = await supabase
  .from('stories')
  .select('*')
  .eq('status', 'active')
  .gte('endDate', new Date().toISOString())
  .lte('startDate', new Date().toISOString())
  .order('createdAt', { ascending: false });

// Filtrer côté client selon le contexte utilisateur
const relevantStories = stories.filter(story => {
  // Logique de ciblage (voir section précédente)
  return isStoryRelevantForUser(story, userContext);
});
```

---

## 🎨 Exemple d'implémentation React Native

```jsx
import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text } from 'react-native';
import Video from 'react-native-video';

function StoryViewer({ stories, onClose, navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStory = stories[currentIndex];

  useEffect(() => {
    // Tracker la vue
    trackStoryView(currentStory.id);
  }, [currentIndex]);

  const handleCTAClick = () => {
    // Tracker le clic
    incrementStoryClicks(currentStory.id);

    // Navigation selon le type
    switch (currentStory.actionType) {
      case 'book_route':
        navigation.navigate('Search', {
          route: currentStory.targetValue
        });
        break;
      
      case 'view_company':
        navigation.navigate('CompanyProfile', {
          companyId: currentStory.createdBy
        });
        break;
    }

    onClose();
  };

  return (
    <View style={styles.container}>
      {/* Média */}
      {currentStory.mediaType === 'image' ? (
        <Image 
          source={{ uri: currentStory.mediaUrl }} 
          style={styles.media}
        />
      ) : (
        <Video 
          source={{ uri: currentStory.mediaUrl }}
          onEnd={() => setCurrentIndex(currentIndex + 1)}
          style={styles.media}
        />
      )}

      {/* Titre */}
      <Text style={styles.title}>{currentStory.title}</Text>

      {/* Bouton CTA */}
      {currentStory.actionType && currentStory.actionType !== 'none' && (
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={handleCTAClick}
        >
          <Text style={styles.ctaText}>
            {currentStory.actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

---

## ✅ Checklist d'intégration

- [ ] **Récupération des stories** : Query Supabase pour stories actives
- [ ] **Filtrage par ciblage** : Implémenter la logique de ciblage (all/route/city/station)
- [ ] **Affichage média** : Support image + vidéo avec durées correctes
- [ ] **Boutons CTA** : Affichage conditionnel selon `actionType`
- [ ] **Navigation** : Routes vers Search (book_route) et CompanyProfile (view_company)
- [ ] **Tracking vues** : Incrémenter `views` à chaque affichage
- [ ] **Tracking clics** : Incrémenter `clicks` à chaque clic CTA
- [ ] **Gestion des dates** : Filtrer par `startDate` et `endDate`
- [ ] **Performance** : Cache des médias pour éviter rechargements

---

## 🚀 Points clés pour le mobile

1. **Simplicité** : Seulement 3 types d'actions (`none`, `book_route`, `view_company`)
2. **Cohérence** : Structure de données stable et bien typée
3. **Performance** : Pré-charger les médias des prochaines stories
4. **Analytics** : Tracking automatique vues/clics pour le dashboard responsable
5. **UX** : Navigation fluide depuis les stories vers réservation/compagnie

---

## 📞 Support

Pour toute question sur l'intégration, référez-vous à :
- Interface TypeScript : `/contexts/DataContext.tsx` (ligne 129)
- Logique création : `/pages/responsable/StoriesPage.tsx`
- Table Supabase : `stories` (à créer selon cette structure)

---

**Version du document** : 1.0  
**Dernière mise à jour** : 2026-01-07  
**Compatible avec** : React Native, Expo, Supabase
