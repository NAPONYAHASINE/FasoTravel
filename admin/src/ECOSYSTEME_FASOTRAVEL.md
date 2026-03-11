# 🌐 ÉCOSYSTÈME FASOTRAVEL - Architecture Complète

**Date:** 2 Février 2026  
**Version:** 2.0 - CLARIFICATION ARCHITECTURE  
**Statut:** 📋 DÉFINITION

---

## 🎯 VISION GLOBALE

FasoTravel est un écosystème complet composé de **3 applications** :

```
┌──────────────────────────────────────────────────────────────┐
│                   ÉCOSYSTÈME FASOTRAVEL                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │   MOBILE    │      │   SOCIÉTÉ   │      │    ADMIN    │ │
│  │ (Passagers) │      │ (Opérateurs)│      │(Superviseur)│ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│        ↓                     ↓                     ↓         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │            BACKEND API + BASE DE DONNÉES                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📱 APPLICATION 1: MOBILE (PASSAGERS)

### 🎯 Rôle
Application pour les **passagers** qui veulent réserver des billets de bus.

### 👥 Utilisateurs
- Passagers (clients finaux)
- Voyageurs occasionnels
- Voyageurs réguliers

### 🔧 Fonctionnalités
1. **Recherche de trajets**
   - Recherche par ville départ/arrivée
   - Filtres par date, horaire, prix
   - Comparaison entre sociétés

2. **Réservation**
   - Sélection de siège
   - Paiement mobile money
   - Génération de ticket/QR code

3. **Gestion compte**
   - Profil passager
   - Historique réservations
   - Favoris et préférences

4. **Suivi en temps réel**
   - Position du bus
   - Notifications retards
   - Alertes arrivée

### 📊 Statut
✅ **DÉJÀ CRÉÉ** par l'utilisateur

---

## 🏢 APPLICATION 2: SOCIÉTÉ (OPÉRATEURS)

### 🎯 Rôle
Application pour les **sociétés de transport** qui gèrent leurs opérations quotidiennes.

### 👥 Utilisateurs (3 rôles)
1. **Responsable** (CEO société)
   - Vision globale de la société
   - Accès à tous les modules
   - Gestion stratégique

2. **Manager** (Chef de gare)
   - Gestion d'une gare spécifique
   - Supervision des départs
   - Gestion des caissiers

3. **Caissier** (Vendeur tickets)
   - Vente de tickets en gare
   - Gestion de caisse
   - Remboursements

### 🔧 Fonctionnalités
1. **Gestion Flotte** 🚌
   - CRUD véhicules
   - Maintenance
   - Seat maps
   - Amenities

2. **Gestion Trajets**
   - Création horaires
   - Planification départs
   - Assignment chauffeurs
   - Gestion des routes

3. **Vente & Caisse**
   - Vente tickets en gare
   - Gestion encaissements
   - Rapports quotidiens
   - Remboursements

4. **Analytics Société**
   - CA journalier/mensuel
   - Taux occupation
   - Performance routes
   - Rapports financiers

### 📊 Statut
✅ **DÉJÀ CRÉÉ** par l'utilisateur (dans `/societe/`)

---

## 👨‍💼 APPLICATION 3: ADMIN (SUPERVISION GLOBALE)

### 🎯 Rôle
Application pour l'**administrateur FasoTravel** qui **supervise tout l'écosystème**.

### 👥 Utilisateurs
- Admin FasoTravel (équipe plateforme)
- Super-administrateurs
- Support technique

### 🔧 Fonctionnalités

#### 1. **Gestion des Passagers** 👥
- Liste tous les passagers (app mobile)
- Profils utilisateurs
- Historique réservations
- Support client
- Bannissement/Suspension

#### 2. **Gestion des Sociétés de Transport** 🏢
- CRUD sociétés de transport
- Validation inscription nouvelles sociétés
- Gestion contrats/commissions
- Statistiques par société
- Performance et notation

#### 3. **Gestion des Gares/Stations** 🚏
- CRUD gares routières
- Géolocalisation
- Assignment aux sociétés
- Équipements et services

#### 4. **Supervision Temps Réel** 🗺️
- Carte GPS tous les bus
- Tracking multi-société
- Alertes retards/incidents
- Dashboard live

#### 5. **Gestion des Incidents** 🚨
- Incidents passagers
- Incidents sociétés
- Résolution support
- Historique

#### 6. **Analytics Globales** 📊
- KPIs plateforme
- Volume réservations
- CA total (toutes sociétés)
- Croissance
- Insights business

#### 7. **Publicité & Marketing** 📢
- Gestion stories/bannières
- Promotions plateforme
- Notifications push
- Campagnes marketing

#### 8. **Intégrations Techniques** 🔌
- API keys management
- Webhooks configuration
- Intégrations paiement
- Logs API

#### 9. **Système de Logs** 📋
- Audit logs
- Sécurité
- Monitoring
- Debug

#### 10. **Support Client** 💬
- Tickets support
- Chat en direct
- FAQs management
- Résolution problèmes

### 📊 Statut
⚠️ **À ADAPTER** - Actuellement à la racine (`/App.tsx`)

---

## 🔄 FLUX DE DONNÉES

### Exemple: Réservation d'un Billet

```
1. PASSAGER (App Mobile)
   └─> Recherche trajet Ouagadougou → Bobo-Dioulasso
   
2. BACKEND API
   └─> Récupère les trajets de TOUTES les sociétés
   
3. PASSAGER (App Mobile)
   └─> Réserve avec "TSR Transport", paie 5000 FCFA
   
4. BACKEND API
   └─> Crée réservation, envoie notification
   
5. CAISSIER (App Société - TSR)
   └─> Voit la réservation dans sa liste
   └─> Valide le QR code du passager à l'embarquement
   
6. ADMIN (App Admin)
   └─> Voit la transaction dans les analytics globales
   └─> Calcule la commission FasoTravel (ex: 2%)
```

---

## 🎨 IDENTITÉ VISUELLE

### Couleurs Burkina Faso 🇧🇫
```css
Rouge:  #dc2626  /* Drapeau burkinabé */
Jaune:  #f59e0b  /* Drapeau burkinabé */
Vert:   #16a34a  /* Drapeau burkinabé */
```

### Nom de Marque
**FasoTravel** (pas TransportBF)

---

## 🗂️ TYPES PARTAGÉS (`/shared/`)

### Entités Principales

```typescript
// UTILISATEURS
PassengerUser      // Utilisateur app mobile
OperatorUser       // Utilisateur app société (3 rôles)

// TRANSPORT
TransportCompany   // Société de transport (géré par Admin)
Route              // Route entre 2 villes
Station            // Gare routière
Vehicle            // Bus/véhicule (géré par Société)
Trip               // Instance de trajet

// RÉSERVATIONS
Ticket             // Billet réservé
Booking            // Réservation

// ADMIN
Incident           // Incident signalé
AuditLog           // Log d'audit
Story              // Contenu marketing
Review             // Avis passager
```

---

## 🔐 ARCHITECTURE TECHNIQUE

### Stack Technique
```
Frontend: React 18 + TypeScript + Tailwind CSS
Backend:  Node.js + Express (ou Python + Django)
Database: PostgreSQL
Cache:    Redis
Storage:  S3 (pour images/documents)
Maps:     Google Maps API
Payment:  Mobile Money APIs (Orange, Moov, etc.)
```

### API Client
Un seul client HTTP dans `/shared/services/apiClient.ts` utilisé par les 3 apps.

---

## 📋 CE QUI DOIT ÊTRE CORRIGÉ

### Application Admin (`/App.tsx`)

#### ❌ Actuellement
L'app Admin est conçue comme une simple interface d'administration générique.

#### ✅ Devrait être
L'app Admin doit être le **superviseur de l'écosystème** :

1. **Gérer les Sociétés de Transport**
   - CRUD sociétés (nom, logo, contact, commission)
   - Validation inscriptions
   - Performance monitoring

2. **Gérer les Passagers**
   - Liste des utilisateurs app mobile
   - Profils et historique
   - Support et modération

3. **Superviser Gares**
   - CRUD gares routières
   - Assignment multi-sociétés
   - Infrastructure

4. **Vue Globale**
   - Dashboard multi-société
   - Analytics plateforme
   - Carte temps réel TOUS les bus

5. **Ne PAS gérer**
   - ❌ Véhicules individuels (c'est dans app Société)
   - ❌ Chauffeurs (c'est dans app Société)
   - ❌ Vente tickets (c'est dans app Société)

---

## 🎯 PROCHAINES ÉTAPES

### Phase 1: Adapter Types `/shared/`
```typescript
// Ajouter type TransportCompany
interface TransportCompany {
  id: string;
  name: string;
  logo: string;
  email: string;
  phone: string;
  commission: number;  // % commission FasoTravel
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
}

// Adapter OperatorUser
interface OperatorUser {
  id: string;
  companyId: string;  // Lié à une société
  role: 'responsable' | 'manager' | 'caissier';
  // ...
}
```

### Phase 2: Refactoriser App Admin
1. **OperatorManagement** → **TransportCompanyManagement**
   - Gérer les SOCIÉTÉS, pas les opérateurs individuels
   
2. **UserManagement** → **PassengerManagement**
   - Gérer les PASSAGERS de l'app mobile

3. **Dashboard** → Vision **multi-société**
   - KPIs globaux plateforme
   - Pas juste une société

4. **GlobalMap** → Tous les bus de **toutes les sociétés**

### Phase 3: Ajuster les Mocks
Créer des mocks cohérents avec l'écosystème.

---

## ✅ VALIDATION

Cette compréhension est-elle correcte ?

- [ ] **Oui**, c'est exactement l'architecture voulue
- [ ] **Non**, il y a des ajustements à faire

---

**🇧🇫 FasoTravel - Écosystème de Transport Burkina Faso**
