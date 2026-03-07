# FasoTravel Admin Application - Spécification Architecturale Complète

**Version:** 1.0  
**Date:** Février 2026  
**Auteur:** Système de Documentation  
**Statut:** Prêt pour implanation

---

## Table des Matières

1. [Vue d'ensemble Architecturale](#vue-densemble-architecturale)
2. [Structure des Dossiers](#structure-des-dossiers)
3. [Technologies & Dépendances](#technologies--dépendances)
4. [Architecture Générale](#architecture-générale)
5. [Authentification & Autorisations](#authentification--autorisations)
6. [Services API](#services-api)
7. [Modèles de Données](#modèles-de-données)
8. [Pages Administrateur](#pages-administrateur)
9. [Composants Réutilisables](#composants-réutilisables)
10. [Hooks Personnalisés](#hooks-personnalisés)
11. [Configuration](#configuration)
12. [Détails d'Implémentation par Domaine](#détails-dimplémentation-par-domaine)
13. [Intégration avec l'App Mobile](#intégration-avec-lapp-mobile)

---

## Vue d'ensemble Architecturale

### Principes Fondamentaux

L'application Admin doit respecter **EXACTEMENT** les mêmes patterns et conventions que l'application Mobile FasoTravel. Elle constitue un **miroir administratif** avec des rôles et permissions différents mais une architecture identique.

```
FasoTravel Admin = FasoTravel Mobile (User) + Permissions Administrateur
```

### Stack Technique (Identique à Mobile)

```
Frontend:
├── React 18.3.1
├── TypeScript 5.3.3
├── Vite (Build tool)
├── TailwindCSS (Styling)
├── Radix UI (Components)
├── motion/react (Animations)
├── React Hook Form (Forms)
└── sonner (Notifications)

Services:
├── React Hooks Personnalisés (état local)
├── api.ts (Couche API centralisée)
└── Services spécialisés (auth, live location, etc.)

État:
├── useState (État local des pages)
├── useEffect (Effets et fetching)
└── Custom hooks (Logique métier réutilisable)
```

### Domaines Administrateur à Couvrir

```
1. DASHBOARD
   ├── Vue d'ensemble des KPIs
   ├── Statistiques temps réel
   ├── Alertes critiques
   └── Activité récente

2. GESTION DES TRAJETS
   ├── Créer/modifier/supprimer trajets
   ├── Gérer segments
   ├── Capacité et disponibilité
   └── Tarification

3. GESTION DES GARES
   ├── CRUD gares
   ├── Localisation GPS
   ├── Photos/informations
   └── Horaires d'ouverture

4. GESTION DES OPÉRATEURS
   ├── CRUD opérateurs
   ├── Véhicules et flottes
   ├── Chauffeurs
   └── Documents

5. GESTION DES RÉSERVATIONS
   ├── Voir toutes les réservations
   ├── Annulation/modification
   ├── HOLD expiré
   └── Transferts de billets

6. GESTION DES PAIEMENTS
   ├── Transactions
   ├── Remboursements
   ├── Réconciliation
   └── Rapports financiers

7. GESTION DES UTILISATEURS
   ├── Créer/modifier utilisateurs
   ├── Rôles et permissions
   ├── Suspendre/activer comptes
   └── Logs d'activité

8. GESTION DES CONTENUS
   ├── Stories/Annonces
   ├── Annonces publicitaires
   ├── Pages statiques
   └── Notifications

9. SUPPORT CLIENT
   ├── Tickets de support
   ├── Messages chat
   ├── Escalade
   └── Résolution

10. RAPPORTS & ANALYTICS
    ├── Ventes par période
    ├── Routes populaires
    ├── Taux d'annulation
    ├── Satisfaction utilisateurs
    └── Export données
```

---

## Structure des Dossiers

```
admin/
├── src/
│   ├── components/
│   │   ├── ui/                          # Composants Radix UI
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── pagination.tsx
│   │   │   └── scroll-area.tsx
│   │   ├── shared/
│   │   │   ├── Navigation.tsx           # Top nav + Sidebar navigation
│   │   │   ├── TopBar.tsx              # Header avec user, notifications
│   │   │   ├── Sidebar.tsx             # Menu latéral avec permissions
│   │   │   ├── BreadcrumbNav.tsx       # Navigation hiérarchique
│   │   │   ├── PermissionGuard.tsx     # Composant pour role-based UI
│   │   │   └── LoadingAnimation.tsx    # Spinners/skeletons
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx            # Carte KPI
│   │   │   ├── ChartWidget.tsx         # Graphique générique (Recharts)
│   │   │   ├── AlertBanner.tsx         # Alertes critiques
│   │   │   ├── ActivityFeed.tsx        # Activité en temps réel
│   │   │   └── MetricsGrid.tsx         # Grille de métriques
│   │   ├── trips/
│   │   │   ├── TripForm.tsx            # Formulaire create/edit trajet
│   │   │   ├── TripTable.tsx           # Tableau des trajets
│   │   │   ├── SegmentEditor.tsx       # Édition segments
│   │   │   ├── CapacityManager.tsx     # Gestion capacité/dispo
│   │   │   └── PricingEditor.tsx       # Tarification
│   │   ├── operators/
│   │   │   ├── OperatorForm.tsx
│   │   │   ├── OperatorTable.tsx
│   │   │   ├── FleetManager.tsx
│   │   │   ├── DriverManagement.tsx
│   │   │   └── DocumentUpload.tsx
│   │   ├── stations/
│   │   │   ├── StationForm.tsx
│   │   │   ├── StationTable.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   └── PhotoManager.tsx
│   │   ├── bookings/
│   │   │   ├── BookingTable.tsx
│   │   │   ├── BookingDetail.tsx
│   │   │   ├── RefundDialog.tsx
│   │   │   └── TransferApproval.tsx
│   │   ├── payments/
│   │   │   ├── TransactionTable.tsx
│   │   │   ├── RefundForm.tsx
│   │   │   └── ReconciliationTool.tsx
│   │   ├── users/
│   │   │   ├── UserTable.tsx
│   │   │   ├── UserForm.tsx
│   │   │   ├── RoleEditor.tsx
│   │   │   └── PermissionMatrix.tsx
│   │   ├── content/
│   │   │   ├── StoryEditor.tsx
│   │   │   ├── AdManager.tsx
│   │   │   ├── NotificationComposer.tsx
│   │   │   └── PageEditor.tsx
│   │   ├── support/
│   │   │   ├── TicketTable.tsx
│   │   │   ├── ChatWidget.tsx
│   │   │   └── EscalationPanel.tsx
│   │   └── charts/
│   │       ├── SalesChart.tsx          # Ventes temps réel
│   │       ├── RouteAnalytics.tsx      # Routes populaires
│   │       ├── CancellationRate.tsx    # Taux d'annulation
│   │       └── UserGrowthChart.tsx     # Croissance utilisateurs
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx           # Connexion admin
│   │   │   ├── MFAPage.tsx             # Auth multi-facteur
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx       # Accueil admin
│   │   │   └── HealthCheckPage.tsx     # Status système
│   │   ├── trips/
│   │   │   ├── TripsListPage.tsx
│   │   │   ├── TripsCreatePage.tsx
│   │   │   ├── TripsEditPage.tsx
│   │   │   └── TripDetailPage.tsx
│   │   ├── operators/
│   │   │   ├── OperatorsListPage.tsx
│   │   │   ├── OperatorsCreatePage.tsx
│   │   │   ├── OperatorsEditPage.tsx
│   │   │   └── OperatorDetailPage.tsx
│   │   ├── stations/
│   │   │   ├── StationsListPage.tsx
│   │   │   ├── StationsCreatePage.tsx
│   │   │   ├── StationsEditPage.tsx
│   │   │   └── StationDetailPage.tsx
│   │   ├── bookings/
│   │   │   ├── BookingsListPage.tsx
│   │   │   └── BookingDetailPage.tsx
│   │   ├── payments/
│   │   │   ├── TransactionsPage.tsx
│   │   │   └── ReconciliationPage.tsx
│   │   ├── users/
│   │   │   ├── UsersListPage.tsx
│   │   │   ├── UsersCreatePage.tsx
│   │   │   └── PermissionsPage.tsx
│   │   ├── content/
│   │   │   ├── StoriesPage.tsx
│   │   │   ├── AdsPage.tsx
│   │   │   └── NotificationsPage.tsx
│   │   ├── support/
│   │   │   └── SupportPage.tsx
│   │   ├── analytics/
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── ExportPage.tsx
│   │   │   └── ReportsPage.tsx
│   │   └── settings/
│   │       ├── SettingsPage.tsx
│   │       ├── SecurityPage.tsx
│   │       └── SystemStatusPage.tsx
│   ├── lib/
│   │   ├── api.ts                       # Couche API (identique pattern Mobile)
│   │   ├── admin-api.ts                 # Extensions endpoints admin
│   │   ├── hooks.ts                     # Hooks réutilisables
│   │   ├── admin-hooks.ts               # Hooks spécifiques admin
│   │   ├── i18n.ts                      # Internationalisation (FR/EN/MO)
│   │   ├── interactions.ts              # Haptic feedback, son
│   │   ├── config.ts                    # Config générale
│   │   ├── auth.ts                      # Gestion auth admin
│   │   ├── permissions.ts               # Matrice permissions
│   │   ├── validators.ts                # Validation formulaires
│   │   └── usePermission.ts             # Hook vérification permissions
│   ├── services/
│   │   ├── api/
│   │   │   ├── trips.service.ts         # Service métier trajets
│   │   │   ├── operators.service.ts
│   │   │   ├── stations.service.ts
│   │   │   ├── bookings.service.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── users.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── export.service.ts
│   │   ├── auth.service.ts
│   │   ├── liveLocation.service.ts
│   │   └── types.ts
│   ├── data/
│   │   ├── models.ts                    # Types centralisés (PARTAGÉ avec Mobile)
│   │   ├── permissions.ts               # Définition rôles/permissions
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── useAuth.ts                   # Gestion auth
│   │   ├── usePermission.ts             # Vérifier permissions
│   │   ├── useadminUser.ts              # Données user admin
│   │   ├── useTrips.ts
│   │   ├── useOperators.ts
│   │   ├── useStations.ts
│   │   ├── useBookings.ts
│   │   ├── usePayments.ts
│   │   ├── useAnalytics.ts
│   │   └── useExport.ts
│   ├── context/
│   │   ├── AuthContext.tsx              # Contexte authentification
│   │   └── PermissionContext.tsx        # Contexte permissions
│   ├── types/
│   │   ├── index.ts
│   │   └── admin.ts                     # Types spécifiques admin
│   ├── styles/
│   │   ├── index.css
│   │   └── admin.css                    # Styles admin (tableau, formes, etc)
│   ├── App.tsx
│   ├── main.tsx
│   └── env.d.ts
├── public/
│   └── manifest.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Technologies & Dépendances

### Dépendances Principales (package.json)

**IDENTIQUE à Mobile pour compatibilité:**

```json
{
  "name": "fasotravel-admin",
  "version": "0.1.0",
  "type": "module",
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-hook-form": "7.55.0",
    "typescript": "5.3.3",
    "@radix-ui/react-*": "^1.x.x",
    "motion": "11.15.0",
    "lucide-react": "0.487.0",
    "recharts": "2.15.2",
    "sonner": "2.0.3",
    "tailwind-merge": "2.4.0",
    "tailwindcss": "3.x.x",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "jspdf": "2.x.x",
    "xlsx": "0.18.x",
    "date-fns": "3.x.x"
  },
  "devDependencies": {
    "vite": "5.x.x",
    "@vitejs/plugin-react-swc": "latest"
  }
}
```

### Dépendances Additionnelles Admin

```json
{
  "recharts": "2.15.2",        // Graphiques (déjà dans Mobile)
  "jspdf": "2.x.x",            // Export PDF
  "xlsx": "0.18.x",            // Export Excel
  "date-fns": "3.x.x",         // Manipulation dates
  "react-query": "3.x.x",      // Caching (optionnel, remplace useState)
  "react-table": "8.x.x",      // Tableaux avancés
  "zod": "3.x.x",              // Validation schémas (optionnel)
  "@react-pdf/renderer": "3.x.x" // PDF avancé (optionnel)
}
```

---

## Architecture Générale

### Pattern de Navigation

**Identique à Mobile** mais avec contexte admin:

```typescript
// App.tsx
export type AdminPage = 
  | 'login'
  | 'mfa'
  | 'dashboard'
  | 'trips'
  | 'trips-create'
  | 'trips-edit'
  | 'operators'
  | 'operators-create'
  | 'stations'
  | 'bookings'
  | 'payments'
  | 'users'
  | 'content'
  | 'support'
  | 'analytics'
  | 'settings';

export function AdminApp() {
  const [currentPage, setCurrentPage] = useState<AdminPage>('login');
  const [pageData, setPageData] = useState<any>(null);

  const handleNavigate = (page: AdminPage, data?: any) => {
    setCurrentPage(page);
    setPageData(data);
  };

  // Rendu conditionnel par page (identique au pattern Mobile)
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'trips':
        return <TripsListPage onNavigate={handleNavigate} />;
      // ...
    }
  };

  return <div>{renderPage()}</div>;
}
```

### Pattern de Composants

**Identique à Mobile:**

```typescript
// Structure standard d'un composant page
interface PageProps {
  onNavigate: (page: AdminPage, data?: any) => void;
  onBack?: () => void;
  data?: any;  // Données passées de la page précédente
}

export function SomePage({ onNavigate, onBack, data }: PageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logique

  return (
    <div className="...">
      {/* Contenu */}
    </div>
  );
}
```

---

## Authentification & Autorisations

### Architecture d'Authentification

```typescript
// lib/auth.ts - Service authentification admin
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;  // 'OPERATOR_ADMIN' | 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'FINANCE_ADMIN'
  permissions: Permission[];
  operator_id?: string;  // Si OPERATOR_ADMIN, lié à un opérateur
  last_login: string;
  mfa_enabled: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  resource: 'TRIPS' | 'OPERATORS' | 'STATIONS' | 'BOOKINGS' | 'PAYMENTS' | 'USERS' | 'CONTENT' | 'ANALYTICS' | 'SETTINGS';
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'APPROVE';
  scope: 'ALL' | 'OWN_OPERATOR' | 'DASHBOARD_ONLY';  // Scope limitation
}

// Rôles prédéfinis
export const ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Accès complet au système',
    permissions: ['*']  // Tous les accès
  },
  OPERATOR_ADMIN: {
    name: 'Admin Opérateur',
    description: 'Gestion trajectes et réservations de son opérateur',
    permissions: [
      'TRIPS:CREATE', 'TRIPS:READ', 'TRIPS:UPDATE', 'TRIPS:DELETE',
      'BOOKINGS:READ', 'BOOKINGS:UPDATE',
      'PAYMENTS:READ',
      'OPERATORS:READ'  // Données de son opérateur uniquement
    ]
  },
  SUPPORT_ADMIN: {
    name: 'Support Client',
    description: 'Gestion tickets, chat, annulations',
    permissions: [
      'BOOKINGS:READ', 'BOOKINGS:UPDATE',
      'USERS:READ',
      'TICKETS:READ', 'TICKETS:UPDATE', 'TICKETS:CREATE'
    ]
  },
  FINANCE_ADMIN: {
    name: 'Finance',
    description: 'Gestion paiements et remboursements',
    permissions: [
      'PAYMENTS:READ', 'PAYMENTS:UPDATE', 'PAYMENTS:APPROVE',
      'BOOKINGS:READ',
      'ANALYTICS:READ', 'ANALYTICS:EXPORT'
    ]
  }
};
```

### Hook de Vérification des Permissions

```typescript
// lib/usePermission.ts
export function usePermission() {
  const { adminUser } = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!adminUser) return false;
    if (adminUser.role === 'SUPER_ADMIN') return true;

    return adminUser.permissions.some(
      p => p.resource === resource && p.action === action
    );
  };

  const canAccess = (pages: AdminPage[]): boolean => {
    return pages.some(page => {
      const requiredPermission = PAGE_PERMISSIONS[page];
      if (!requiredPermission) return true;  // Pas de restriction
      return hasPermission(requiredPermission.resource, requiredPermission.action);
    });
  };

  return { hasPermission, canAccess, adminUser };
}

// Utilisation
function TripsPage({ onNavigate }: PageProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission('TRIPS', 'READ')) {
    return <AccessDeniedPage />;
  }

  return (
    <>
      {hasPermission('TRIPS', 'CREATE') && (
        <Button onClick={() => onNavigate('trips-create')}>Créer trajet</Button>
      )}
    </>
  );
}
```

### Contexte d'Authentification

```typescript
// context/AuthContext.tsx
interface AuthContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginMFA: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier session au montage
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Login failed');

    const { user, token, mfa_required } = await response.json();

    if (mfa_required) {
      // Rediriger vers page MFA
      return;
    }

    setAdminUser(user);
    localStorage.setItem('admin_token', token);
  };

  return (
    <AuthContext.Provider value={{ adminUser, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

---

## Services API

### Couche API Centralisée (admin-api.ts)

**EXTENSION** de api.ts avec endpoints admin:

```typescript
// lib/admin-api.ts

const ADMIN_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/admin';

// ============================================
// TRAJET - ENDPOINTS ADMIN
// ============================================

export async function createTrip(data: CreateTripRequest): Promise<Trip> {
  const response = await fetch(`${ADMIN_BASE_URL}/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error('Failed to create trip');
  return response.json();
}

export async function updateTrip(tripId: string, data: UpdateTripRequest): Promise<Trip> {
  const response = await fetch(`${ADMIN_BASE_URL}/trips/${tripId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error('Failed to update trip');
  return response.json();
}

export async function deleteTrip(tripId: string): Promise<void> {
  const response = await fetch(`${ADMIN_BASE_URL}/trips/${tripId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });

  if (!response.ok) throw new Error('Failed to delete trip');
}

export async function updateTripCapacity(
  tripId: string,
  data: { segment_id: string; available_seats: number }
): Promise<void> {
  const response = await fetch(`${ADMIN_BASE_URL}/trips/${tripId}/capacity`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error('Failed to update capacity');
}

// ============================================
// OPÉRATEUR - ENDPOINTS ADMIN
// ============================================

export async function createOperator(data: CreateOperatorRequest): Promise<Operator> {
  const response = await fetch(`${ADMIN_BASE_URL}/operators`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error('Failed to create operator');
  return response.json();
}

export async function updateOperator(operatorId: string, data: UpdateOperatorRequest): Promise<Operator> {
  const response = await fetch(`${ADMIN_BASE_URL}/operators/${operatorId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error('Failed to update operator');
  return response.json();
}

export async function deleteOperator(operatorId: string): Promise<void> {
  const response = await fetch(`${ADMIN_BASE_URL}/operators/${operatorId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });

  if (!response.ok) throw new Error('Failed to delete operator');
}

// ============================================
// RÉSERVATION - ENDPOINTS ADMIN
// ============================================

export async function cancelBooking(bookingId: string, reason: string): Promise<void> {
  const response = await fetch(`${ADMIN_BASE_URL}/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ reason })
  });

  if (!response.ok) throw new Error('Failed to cancel booking');
}

export async function approveTransfer(transferId: string): Promise<void> {
  const response = await fetch(`${ADMIN_BASE_URL}/transfers/${transferId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });

  if (!response.ok) throw new Error('Failed to approve transfer');
}

export async function refundBooking(bookingId: string, amount: number): Promise<void> {
  const response = await fetch(`${ADMIN_BASE_URL}/bookings/${bookingId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ amount })
  });

  if (!response.ok) throw new Error('Failed to refund booking');
}

// ============================================
// UTILISATEUR - ENDPOINTS ADMIN
// ============================================

export async function createAdminUser(data: CreateAdminUserRequest): Promise<AdminUser> {
  const response = await fetch(`${ADMIN_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
}

export async function updateAdminUser(userId: string, data: UpdateAdminUserRequest): Promise<AdminUser> {
  const response = await fetch(`${ADMIN_BASE_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error('Failed to update user');
  return response.json();
}

export async function suspendUser(userId: string): Promise<void> {
  const response = await fetch(`${ADMIN_BASE_URL}/users/${userId}/suspend`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });

  if (!response.ok) throw new Error('Failed to suspend user');
}

// ============================================
// ANALYTICS - ENDPOINTS ADMIN
// ============================================

export async function getAnalytics(params: {
  startDate: string;
  endDate: string;
  metrics: string[];
  groupBy?: 'day' | 'week' | 'month';
}): Promise<AnalyticsData> {
  const query = new URLSearchParams();
  query.set('start_date', params.startDate);
  query.set('end_date', params.endDate);
  query.set('metrics', params.metrics.join(','));
  if (params.groupBy) query.set('group_by', params.groupBy);

  const response = await fetch(`${ADMIN_BASE_URL}/analytics?${query}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });

  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

export async function exportData(format: 'csv' | 'xlsx' | 'pdf', filters?: any): Promise<Blob> {
  const response = await fetch(`${ADMIN_BASE_URL}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ format, filters })
  });

  if (!response.ok) throw new Error('Failed to export data');
  return response.blob();
}
```

### Services Spécialisés

```typescript
// services/api/trips.service.ts
export class TripsService {
  static async createTrip(data: CreateTripRequest): Promise<Trip> {
    return adminApi.createTrip(data);
  }

  static async updateCapacity(tripId: string, updates: CapacityUpdate[]): Promise<void> {
    for (const update of updates) {
      await adminApi.updateTripCapacity(tripId, update);
    }
  }

  static async validateTripData(data: CreateTripRequest): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    if (!data.from_stop_id) errors.push({ field: 'from_stop_id', message: 'Départ requis' });
    if (!data.to_stop_id) errors.push({ field: 'to_stop_id', message: 'Destination requise' });
    if (!data.departure_time) errors.push({ field: 'departure_time', message: 'Heure départ requise' });
    if (data.departure_time >= data.arrival_time) errors.push({ field: 'arrival_time', message: 'Arrivée doit être après départ' });

    // Validations métier
    const minCapacity = Math.min(...data.segments.map(s => s.available_seats));
    if (data.available_seats !== minCapacity) {
      errors.push({
        field: 'available_seats',
        message: `Doit être ${minCapacity} (min des segments)`
      });
    }

    return errors;
  }
}

// services/api/analytics.service.ts
export class AnalyticsService {
  static async getSalesData(period: 'day' | 'week' | 'month'): Promise<SalesData> {
    return adminApi.getAnalytics({
      startDate: getStartDate(period),
      endDate: formatDate(new Date()),
      metrics: ['total_sales', 'booking_count', 'avg_ticket_price'],
      groupBy: period
    });
  }

  static async getRouteMetrics(): Promise<RouteMetrics[]> {
    return adminApi.getAnalytics({
      startDate: getStartDate('month'),
      endDate: formatDate(new Date()),
      metrics: ['route_name', 'booking_count', 'cancellation_rate', 'avg_occupancy']
    }) as Promise<RouteMetrics[]>;
  }

  static async getCancellationAnalysis(): Promise<CancellationAnalysis> {
    return adminApi.getAnalytics({
      startDate: getStartDate('month'),
      endDate: formatDate(new Date()),
      metrics: ['cancellations_total', 'cancellations_by_reason', 'cancellation_rate']
    }) as Promise<CancellationAnalysis>;
  }
}
```

---

## Modèles de Données

### Types Centralisés (data/models.ts - PARTAGÉ)

```typescript
// Types utilisés IDENTIQUEMENT dans Mobile et Admin

export type UserRole = 'USER' | 'OPERATOR_ADMIN' | 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'FINANCE_ADMIN';

export interface Trip {
  trip_id: string;
  operator_id: string;
  from_stop_id: string;
  to_stop_id: string;
  departure_time: string;  // ISO 8601
  arrival_time: string;
  available_seats: number;  // ⚠️ RÈGLE CRITIQUE: min(segments[].available_seats)
  price_per_seat: number;
  vehicle_type: 'MINIBUS' | 'BUS' | 'VAN';
  amenities: string[];  // ['wifi', 'ac', 'bathroom', 'usb']
  segments: Segment[];
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
}

export interface Segment {
  segment_id: string;
  from_stop_id: string;
  to_stop_id: string;
  distance_km: number;
  duration_minutes: number;
  available_seats: number;
}

export interface Operator {
  operator_id: string;
  name: string;
  description?: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  document_type: 'BUSINESS_LICENSE' | 'PERMIT';
  document_url: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  created_at: string;
  approval_date?: string;
  approved_by?: string;  // Admin ID
  vehicles: Vehicle[];
  stations: Station[];
}

export interface Vehicle {
  vehicle_id: string;
  operator_id: string;
  registration: string;
  type: 'MINIBUS' | 'BUS' | 'VAN';
  capacity: number;
  amenities: string[];
  documents: VehicleDocument[];
  status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';
}

export interface Booking {
  booking_id: string;
  user_id: string;
  trip_id: string;
  seats: string[];  // ['A1', 'A2']
  passengers_info: PassengerInfo[];
  total_price: number;
  status: 'HOLD' | 'PAID' | 'EMBARKED' | 'CANCELLED';
  hold_until?: string;  // TTL pour HOLD (10 min après création)
  payment_method?: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'CARD';
  created_at: string;
  paid_at?: string;
  embarked_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface Ticket {
  ticket_id: string;
  booking_id: string;
  user_id: string;
  trip_id: string;
  seat: string;  // 'A1'
  passenger_name: string;
  qr_code: string;
  barcode: string;  // Code alphanumérique
  status: 'AVAILABLE' | 'TRANSFERRED' | 'EMBARKED' | 'CANCELLED';
  transfer_token?: string;  // Single-use token pour transfert
  transfer_expires_at?: string;
  created_at: string;
}

export interface Payment {
  payment_id: string;
  booking_id: string;
  amount: number;
  currency: 'XOF';
  method: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'CARD';
  provider_reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  created_at: string;
  completed_at?: string;
  refunded_at?: string;
  metadata: Record<string, any>;
}

export interface Station {
  station_id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  opening_hours?: string;  // '08:00-20:00'
  services: string[];  // ['parking', 'restaurant', 'wc', 'clinic']
  photos: string[];
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface AdminUser {
  user_id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  operator_id?: string;  // Si OPERATOR_ADMIN
  last_login: string;
  mfa_enabled: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  created_at: string;
}

export interface Permission {
  resource: 'TRIPS' | 'OPERATORS' | 'STATIONS' | 'BOOKINGS' | 'PAYMENTS' | 'USERS' | 'CONTENT' | 'ANALYTICS' | 'SETTINGS';
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'APPROVE';
  scope: 'ALL' | 'OWN_OPERATOR' | 'DASHBOARD_ONLY';
}
```

### Types Spécifiques Admin (types/admin.ts)

```typescript
// Types ADDITIONNELS pour Admin (ne redéfinissent pas les types Share)

export interface CreateTripRequest {
  operator_id: string;
  from_stop_id: string;
  to_stop_id: string;
  departure_time: string;
  arrival_time: string;
  vehicle_id: string;
  price_per_seat: number;
  amenities: string[];
  segments: CreateSegmentRequest[];
}

export interface CreateSegmentRequest {
  from_stop_id: string;
  to_stop_id: string;
  distance_km: number;
  duration_minutes: number;
  stop_order: number;
  available_seats: number;
}

export interface UpdateTripRequest {
  departure_time?: string;
  arrival_time?: string;
  price_per_seat?: number;
  status?: 'ACTIVE' | 'CANCELLED';
  amenities?: string[];
}

export interface CapacityUpdate {
  segment_id: string;
  available_seats: number;
  reason?: string;  // 'Route diverted', 'Maintenance', etc
}

export interface CreateOperatorRequest {
  name: string;
  description?: string;
  phone: string;
  email: string;
  website?: string;
  logo_file?: File;
  document_file: File;  // License/Permit
  document_type: 'BUSINESS_LICENSE' | 'PERMIT';
}

export interface UpdateOperatorRequest {
  name?: string;
  description?: string;
  website?: string;
  status?: 'PENDING' | 'APPROVED' | 'SUSPENDED';
}

export interface CreateAdminUserRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  operator_id?: string;
  send_invite: boolean;
}

export interface UpdateAdminUserRequest {
  name?: string;
  role?: UserRole;
  status?: 'ACTIVE' | 'SUSPENDED';
  permissions_override?: Permission[];
}

export interface BookingFilter {
  status?: 'HOLD' | 'PAID' | 'EMBARKED' | 'CANCELLED';
  trip_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  operator_id?: string;
}

export interface AnalyticsData {
  period: {
    start_date: string;
    end_date: string;
  };
  metrics: {
    total_bookings: number;
    total_revenue: number;
    cancelled_bookings: number;
    avg_occupancy: number;
    cancellation_rate: number;
  };
  trend_data: TrendPoint[];
  breakdown: {
    by_operator: OperatorMetric[];
    by_route: RouteMetric[];
    by_payment_method: PaymentMethodMetric[];
  };
}

export interface TrendPoint {
  date: string;
  bookings: number;
  revenue: number;
  cancellations: number;
}

export interface OperatorMetric {
  operator_id: string;
  operator_name: string;
  bookings: number;
  revenue: number;
  trips_active: number;
  cancellation_rate: number;
}

export interface RouteMetric {
  route_id: string;
  from: string;
  to: string;
  bookings: number;
  revenue: number;
  cancellation_rate: number;
  avg_occupancy: number;
}

export interface PaymentMethodMetric {
  method: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'CARD';
  count: number;
  total_amount: number;
  success_rate: number;
}
```

---

## Pages Administrateur

### 1. Page d'Authentification

```typescript
// pages/auth/LoginPage.tsx
export function LoginPage({ onNavigate }: PageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await login(email, password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">FasoTravel Admin</h1>
          <p className="text-gray-600 dark:text-gray-400">Connexion administrateur</p>
        </div>

        {error && <AlertBanner type="error" message={error} />}

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fasotravel.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
          >
            Connexion
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          <Link to="/forgot-password">Mot de passe oublié?</Link>
        </p>
      </Card>
    </motion.div>
  );
}
```

### 2. Dashboard Principal

```typescript
// pages/dashboard/DashboardPage.tsx
export function DashboardPage({ onNavigate, onBack }: PageProps) {
  const { hasPermission } = usePermission();
  const { analytics, isLoading, error } = useAnalytics({
    period: 'day',
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date())
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Bienvenue, {adminUser?.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Réservations (24h)"
          value={analytics?.metrics.total_bookings || 0}
          trend={12}  // % change
          icon="🎫"
        />
        <StatCard
          label="Revenu (24h)"
          value={`${formatCurrency(analytics?.metrics.total_revenue || 0)}`}
          trend={-5}
          icon="💰"
        />
        <StatCard
          label="Taux d'annulation"
          value={`${(analytics?.metrics.cancellation_rate || 0).toFixed(1)}%`}
          trend={2}
          icon="⚠️"
        />
        <StatCard
          label="Taux d'occupation moy"
          value={`${(analytics?.metrics.avg_occupancy || 0).toFixed(0)}%`}
          trend={8}
          icon="🚌"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title="Ventes (7 derniers jours)"
          data={analytics?.trend_data}
          type="line"
          dataKey="revenue"
        />
        <ChartWidget
          title="Réservations par opérateur"
          data={analytics?.breakdown.by_operator}
          type="bar"
          dataKey="bookings"
        />
      </div>

      {/* Activity Feed */}
      {hasPermission('BOOKINGS', 'READ') && (
        <ActivityFeed />
      )}

      {/* Alerts */}
      <AlertBanner
        type="warning"
        title="2 retards majeurs détectés"
        message="Opérateurs avec ≥ 30% retards",
      />
    </div>
  );
}
```

### 3. Page Gestion des Trajets

```typescript
// pages/trips/TripsListPage.tsx
export function TripsListPage({ onNavigate }: PageProps) {
  const { hasPermission } = usePermission();
  const { trips, isLoading, error, refetch } = useTrips({
    operator_id: adminUser?.operator_id,  // Filtrer si OPERATOR_ADMIN
    status: 'ACTIVE'
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const columns: ColumnDef<Trip>[] = [
    {
      accessorKey: 'trip_id',
      header: 'ID'
    },
    {
      accessorKey: 'operator_id',
      header: 'Opérateur',
      cell: ({ row }) => getOperatorName(row.original.operator_id)
    },
    {
      accessorKey: 'from_stop_id',
      header: 'Départ',
      cell: ({ row }) => getStationName(row.original.from_stop_id)
    },
    {
      accessorKey: 'to_stop_id',
      header: 'Arrivée',
      cell: ({ row }) => getStationName(row.original.to_stop_id)
    },
    {
      accessorKey: 'departure_time',
      header: 'Heure',
      cell: ({ row }) => formatTime(row.original.departure_time)
    },
    {
      accessorKey: 'available_seats',
      header: 'Places libres'
    },
    {
      accessorKey: 'price_per_seat',
      header: 'Prix',
      cell: ({ row }) => formatCurrency(row.original.price_per_seat)
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('trips-edit', row.original.trip_id)}
            disabled={!hasPermission('TRIPS', 'UPDATE')}
          >
            Éditer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('trip-detail', row.original.trip_id)}
          >
            Détails
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trajets</h1>
        {hasPermission('TRIPS', 'CREATE') && (
          <Button onClick={() => onNavigate('trips-create')}>
            + Créer trajet
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={trips}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          pageSize,
          total: trips.length,
          onPageChange: setPageIndex,
          onPageSizeChange: setPageSize
        }}
      />
    </div>
  );
}
```

### 4. Page Création/Édition de Trajet

```typescript
// pages/trips/TripsEditPage.tsx
export function TripsEditPage({ onNavigate, data: tripId }: PageProps) {
  const { trip, isLoading } = useTripById(tripId);
  const { hasPermission } = usePermission();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CreateTripRequest>({
    resolver: zodResolver(createTripSchema),
    defaultValues: trip ? mapTripToForm(trip) : undefined
  });

  const handleSave = async (data: CreateTripRequest) => {
    try {
      setIsSaving(true);
      await updateTrip(tripId, data);
      toast.success('Trajet mis à jour');
      onNavigate('trips');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <BreadcrumbNav items={[
        { label: 'Trajets', onClick: () => onNavigate('trips') },
        { label: 'Éditer' }
      ]} />

      <h1 className="text-3xl font-bold mb-6">Éditer trajet</h1>

      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        {/* Section Informations Générales */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Informations générales</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="operator_id"
                render={({ field }) => (
                  <FormItem>
                    <Label>Opérateur</Label>
                    <OperatorSelect {...field} disabled={!hasPermission('TRIPS', 'UPDATE')} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <Label>Véhicule</Label>
                    <VehicleSelect {...field} operatorId={form.watch('operator_id')} />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="from_stop_id"
                render={({ field }) => (
                  <FormItem>
                    <Label>Départ</Label>
                    <StationSelect {...field} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="to_stop_id"
                render={({ field }) => (
                  <FormItem>
                    <Label>Arrivée</Label>
                    <StationSelect {...field} />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departure_time"
                render={({ field }) => (
                  <FormItem>
                    <Label>Heure départ</Label>
                    <Input type="datetime-local" {...field} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="arrival_time"
                render={({ field }) => (
                  <FormItem>
                    <Label>Heure arrivée</Label>
                    <Input type="datetime-local" {...field} />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Segments */}
        <SegmentEditor
          segments={form.watch('segments')}
          onChange={(segments) => form.setValue('segments', segments)}
          disabled={!hasPermission('TRIPS', 'UPDATE')}
        />

        {/* Section Tarification */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Tarification</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="price_per_seat"
              render={({ field }) => (
                <FormItem>
                  <Label>Prix par siège (XOF)</Label>
                  <Input type="number" step="100" {...field} />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Boutons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            loading={isSaving}
            disabled={!hasPermission('TRIPS', 'UPDATE')}
          >
            Enregistrer
          </Button>
          <Button type="button" variant="outline" onClick={() => onNavigate('trips')}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
```

### 5. Page Gestion des Opérateurs

```typescript
// pages/operators/OperatorsListPage.tsx
export function OperatorsListPage({ onNavigate }: PageProps) {
  const { hasPermission } = usePermission();
  const { operators, isLoading } = useOperators();

  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');

  const filteredOperators = filter === 'ALL'
    ? operators
    : operators.filter(op => op.status === filter);

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Opérateurs</h1>
        {hasPermission('OPERATORS', 'CREATE') && (
          <Button onClick={() => onNavigate('operators-create')}>
            + Ajouter opérateur
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="ALL">Tous ({operators.length})</TabsTrigger>
          <TabsTrigger value="PENDING">En attente ({operators.filter(o => o.status === 'PENDING').length})</TabsTrigger>
          <TabsTrigger value="APPROVED">Approuvés ({operators.filter(o => o.status === 'APPROVED').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <OperatorTable
        operators={filteredOperators}
        isLoading={isLoading}
        onEdit={(id) => onNavigate('operators-edit', id)}
        onDetail={(id) => onNavigate('operator-detail', id)}
        onApprove={hasPermission('OPERATORS', 'UPDATE')}
      />
    </div>
  );
}
```

### 6. Page Analytique et Rapports

```typescript
// pages/analytics/AnalyticsPage.tsx
export function AnalyticsPage({ onNavigate }: PageProps) {
  const { hasPermission } = usePermission();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [startDate, setStartDate] = useState(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState(new Date());

  const { analytics, isLoading } = useAnalytics({
    startDate: formatISO(startingDate, { representation: 'date' }),
    endDate: formatISO(endDate, { representation: 'date' }),
    period,
    metrics: [
      'total_bookings',
      'total_revenue',
      'cancellation_rate',
      'avg_occupancy'
    ]
  });

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const blob = await exportData(format, {
        startDate,
        endDate,
        period
      });
      downloadBlob(blob, `analytics-${format}`);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Analytique et Rapports</h1>

      {/* Filtres */}
      <Card className="bg-gray-50 dark:bg-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label>De</Label>
            <Input
              type="date"
              value={formatISO(startDate, { representation: 'date' })}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />
          </div>
          <div>
            <Label>À</Label>
            <Input
              type="date"
              value={formatISO(endDate, { representation: 'date' })}
              onChange={(e) => setEndDate(new Date(e.target.value))}
            />
          </div>
          <div>
            <Label>Période</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
            </Select>
          </div>
          <div>
            <Button onClick={() => handleExport('xlsx')}>
              📊 Export Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total réservations"
          value={analytics?.metrics.total_bookings}
        />
        <MetricCard
          label="Total revenu"
          value={formatCurrency(analytics?.metrics.total_revenue || 0)}
        />
        <MetricCard
          label="Taux annulation"
          value={`${(analytics?.metrics.cancellation_rate || 0).toFixed(1)}%`}
        />
        <MetricCard
          label="Occupation moy"
          value={`${(analytics?.metrics.avg_occupancy || 0).toFixed(0)}%`}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWidget
          title="Ventes par jour"
          data={analytics?.trend_data}
          type="area"
          dataKey="revenue"
        />
        <ChartWidget
          title="Réservations par jour"
          data={analytics?.trend_data}
          type="bar"
          dataKey="bookings"
        />
      </div>

      {/* Détails par opérateur */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Réservations par opérateur</h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opérateur</TableHead>
                <TableHead>Réservations</TableHead>
                <TableHead>Revenu</TableHead>
                <TableHead>Taux annulation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics?.breakdown.by_operator.map(op => (
                <TableRow key={op.operator_id}>
                  <TableCell>{op.operator_name}</TableCell>
                  <TableCell>{op.bookings}</TableCell>
                  <TableCell>{formatCurrency(op.revenue)}</TableCell>
                  <TableCell>{(op.cancellation_rate * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 7. Page Gestion des Réservations

```typescript
// pages/bookings/BookingsListPage.tsx
export function BookingsListPage({ onNavigate }: PageProps) {
  const { hasPermission } = usePermission();
  const [filters, setFilters] = useState<BookingFilter>({
    status: undefined,
    date_from: formatISO(subMonths(new Date(), 1), { representation: 'date' }),
    date_to: formatISO(new Date(), { representation: 'date' })
  });

  const { bookings, isLoading, refetch } = useBookings(filters);

  const handleCancel = async (bookingId: string) => {
    if (!hasPermission('BOOKINGS', 'UPDATE')) return;

    const dialog = showDialog({
      title: 'Annuler réservation',
      message: 'Êtes-vous sûr? Cela généreras un remboursement.',
      actions: [
        { label: 'Annuler', variant: 'outline' },
        { label: 'Confirmer annulation', variant: 'destructive' }
      ]
    });

    if (dialog.action === 1) {
      try {
        await cancelBooking(bookingId, 'Admin cancellation');
        toast.success('Réservation annulée');
        refetch();
      } catch (error) {
        toast.error('Erreur lors de l\'annulation');
      }
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-3xl font-bold">Réservations</h1>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Statut</Label>
            <Select
              value={filters.status || ''}
              onValueChange={(v) => setFilters({ ...filters, status: v as any })}
            >
              <SelectItem value="">Tous</SelectItem>
              <SelectItem value="HOLD">En attente</SelectItem>
              <SelectItem value="PAID">Payées</SelectItem>
              <SelectItem value="EMBARKED">Embarquées</SelectItem>
              <SelectItem value="CANCELLED">Annulées</SelectItem>
            </Select>
          </div>
          <div>
            <Label>De</Label>
            <Input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </div>
          <div>
            <Label>À</Label>
            <Input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => refetch()}>
              Appliquer filtres
            </Button>
          </div>
        </div>
      </Card>

      <BookingTable
        bookings={bookings}
        isLoading={isLoading}
        onDetail={(id) => onNavigate('booking-detail', id)}
        onCancel={handleCancel}
        canCancel={hasPermission('BOOKINGS', 'UPDATE')}
      />
    </div>
  );
}
```

---

## Composants Réutilisables

### 1. Navigation Sidebar

```typescript
// components/shared/Sidebar.tsx
export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { hasPermission, adminUser } = usePermission();

  const menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      page: 'dashboard',
      requiredPermission: { resource: '*', action: 'READ' }  // Tous accès
    },
    {
      label: 'Trajets',
      icon: 'Route',
      page: 'trips',
      requiredPermission: { resource: 'TRIPS', action: 'READ' }
    },
    {
      label: 'Opérateurs',
      icon: 'Building2',
      page: 'operators',
      requiredPermission: { resource: 'OPERATORS', action: 'READ' }
    },
    {
      label: 'Gares',
      icon: 'MapPin',
      page: 'stations',
      requiredPermission: { resource: 'STATIONS', action: 'READ' }
    },
    {
      label: 'Réservations',
      icon: 'Ticket',
      page: 'bookings',
      requiredPermission: { resource: 'BOOKINGS', action: 'READ' }
    },
    {
      label: 'Paiements',
      icon: 'CreditCard',
      page: 'payments',
      requiredPermission: { resource: 'PAYMENTS', action: 'READ' }
    },
    {
      label: 'Utilisateurs',
      icon: 'Users',
      page: 'users',
      requiredPermission: { resource: 'USERS', action: 'READ' },
      roleRequired: 'SUPER_ADMIN'
    },
    {
      label: 'Contenu',
      icon: 'FileText',
      page: 'content',
      requiredPermission: { resource: 'CONTENT', action: 'READ' }
    },
    {
      label: 'Support',
      icon: 'Headphones',
      page: 'support',
      requiredPermission: { resource: 'SUPPORT', action: 'READ' }
    },
    {
      label: 'Analytics',
      icon: 'BarChart3',
      page: 'analytics',
      requiredPermission: { resource: 'ANALYTICS', action: 'READ' }
    },
    {
      label: 'Paramètres',
      icon: 'Settings',
      page: 'settings',
      requiredPermission: { resource: 'SETTINGS', action: 'READ' }
    },
  ];

  const visibleItems = menuItems.filter(item => {
    if (item.roleRequired && adminUser?.role !== item.roleRequired) return false;
    return hasPermission(item.requiredPermission.resource, item.requiredPermission.action);
  });

  return (
    <aside className="w-64 bg-gray-900 text-white">
      <div className="p-6">
        <h1 className="text-xl font-bold">FasoTravel</h1>
        <p className="text-sm text-gray-400">Admin Panel</p>
      </div>

      <nav className="space-y-2 px-4">
        {visibleItems.map(item => {
          const Icon = lucideIcons[item.icon];
          const isActive = currentPage === item.page;

          return (
            <motion.button
              key={item.page}
              onClick={() => onNavigate(item.page as AdminPage)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
              whileHover={{ x: 4 }}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}
```

### 2. Tableau Générique

```typescript
// components/shared/DataTable.tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: PaginationConfig<T>;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  pagination,
  onRowClick
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: pagination?.pageIndex || 0,
        pageSize: pagination?.pageSize || 10
      }
    }
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-6 py-3 text-left text-sm font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center">
                  <Spinner />
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                  Aucune donnée
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <motion.tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination
          {...pagination}
          pageCount={table.getPageCount()}
          canPrevious={table.getCanPreviousPage()}
          canNext={table.getCanNextPage()}
          onPrevious={() => table.previousPage()}
          onNext={() => table.nextPage()}
        />
      )}
    </div>
  );
}
```

### 3. Graphique Générique

```typescript
// components/charts/ChartWidget.tsx
interface ChartWidgetProps {
  title: string;
  data: any[];
  type: 'line' | 'bar' | 'area' | 'pie';
  dataKey: string;
  height?: number;
  color?: string;
}

export function ChartWidget({
  title,
  data,
  type,
  dataKey,
  height = 300,
  color = '#16a34a'
}: ChartWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {type === 'line' && (
            <LineChart data={data}>
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={color} />
            </LineChart>
          )}
          {type === 'bar' && (
            <BarChart data={data}>
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} />
            </BarChart>
          )}
          {/* Autres types... */}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

## Hooks Personnalisés

### Hooks Génériques (Partagés avec Mobile)

```typescript
// hooks/useAuth.ts
export function useAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Login failed');
    const { user, token } = await response.json();
    setAdminUser(user);
    localStorage.setItem('admin_token', token);
  };

  return { adminUser, isLoading, login, logout: logoutFunc };
}

// hooks/usePermission.ts
export function usePermission() {
  const { adminUser } = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!adminUser) return false;
    if (adminUser.role === 'SUPER_ADMIN') return true;

    return adminUser.permissions?.some(
      p => p.resource === resource && p.action === action
    ) || false;
  };

  return { hasPermission, adminUser };
}

// hooks/useTrips.ts
export function useTrips(filter?: TripFilter) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
  }, [filter]);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getTrips(filter);
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  return { trips, isLoading, error, refetch: fetchTrips };
}

// hooks/useBookings.ts
export function useBookings(filter?: BookingFilter) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getBookings(filter);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { bookings, isLoading, refetch: fetchBookings };
}

// hooks/useAnalytics.ts
export function useAnalytics(params: AnalyticsParams) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [params.startDate, params.endDate, params.period]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getAnalytics(params);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { analytics, isLoading, refetch: fetchAnalytics };
}
```

---

## Configuration

### vite.config.ts (Identique à Mobile)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3001,  // Port différent de Mobile (3000)
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    },
  },
});
```

### tsconfig.json (Identique à Mobile)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tailwind.config.js

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#f0fdf4',
          600: '#16a34a',
          700: '#15803d',
        },
        amber: {
          50: '#fffbeb',
          600: '#d97706',
        },
        red: {
          600: '#dc2626',
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms')],
  darkMode: 'class',
};
```

### .env.example

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=FasoTravel Admin
VITE_APP_VERSION=0.1.0
VITE_ENABLE_MFA=true
VITE_SESSION_TIMEOUT=3600
```

---

## Détails d'implémentation par Domaine

### A. GESTION DES TRAJETS

#### Règles Métier Critiques

```typescript
/**
 * RÈGLE 1: Disponibilité = MIN des segments
 * 
 * Un trajet Ouaga → Bobo se decompose en segments:
 * - Ouaga → Koudougou: 12 places libres
 * - Koudougou → Bobo: 18 places libres
 * 
 * Disponibilité RÉELLE du trajet = 12 (le minimum)
 * Seuls 12 passagers peuvent voyager Ouaga → Bobo
 */
export function validateCapacity(trip: Trip): boolean {
  const minSegmentCapacity = Math.min(
    ...trip.segments.map(s => s.available_seats)
  );
  return trip.available_seats === minSegmentCapacity;
}

/**
 * RÈGLE 2: Modification de capacité affecte tous les segments adjacents
 * 
 * Si un passager annule, les places se libèrent:
 * - Uniquement sur ses segments traversés
 * - Pas sur les autres segments
 * 
 * Exemple: Passager Ouaga → Koudougou annule → +1 place sur segment Ouaga → Koudougou
 *          Mais pas sur segment Bobo → Ouaga (qu'il ne prenait pas)
 */
export function updateSegmentCapacity(
  booking: Booking,
  action: 'release' | 'hold'
): SegmentUpdate[] {
  const trip = getTrip(booking.trip_id);
  const passengerSegments = getPassengerSegments(
    trip,
    booking.from_stop_id,
    booking.to_stop_id
  );

  return passengerSegments.map(segment => ({
    segment_id: segment.segment_id,
    delta: action === 'release' ? bookingsCount : -bookingsCount,
    reason: `Booking ${booking.booking_id} ${action}`
  }));
}

/**
 * RÈGLE 3: Prix par trajet
 * 
 * Le prix est défini au niveau du trajet entier
 * S'applique à tous les segments (prix unique)
 * Les segments n'ont pas de prix différencié
 */
```

#### Formulaire de Création

```typescript
// Le composant TripForm valide:
// - Dates cohérentes (départ < arrivée)
// - Segments en ordre (stop_order croissant)
// - Capacité = MIN(segments)
// - Distance > 0, durée > 0
// - Prix >= 0
```

### B. GESTION DES OPÉRATEURS

#### Workflow d'Approbation

```typescript
/**
 * États:
 * 1. PENDING - Créé par l'opérateur, attend approbation
 * 2. APPROVED - Approbé par SUPER_ADMIN, peut créer trajets
 * 3. SUSPENDED - Suspendu (documents expirés, fraude, etc)
 * 4. REJECTED - Rejeté définitivement
 */

export function approveOperator(operatorId: string, adminUserId: string) {
  return updateOperator(operatorId, {
    status: 'APPROVED',
    approved_by: adminUserId,
    approval_date: new Date().toISOString()
  });
}

export function suspendOperator(operatorId: string, reason: string) {
  return updateOperator(operatorId, {
    status: 'SUSPENDED',
    suspension_reason: reason,
    all_trips_cancelled: true  // Annule tous ses trajets en attente
  });
}
```

### C. GESTION DES RÉSERVATIONS

#### États de Réservation

```typescript
/**
 * HOLD (Attente paiement)
 * └─ TTL: 10 minutes
 * └─ Places RESERVEES mais pas confirmées
 * └─ Si TTL expire → libération automatique des places
 * 
 * PAID (Confirmée)
 * └─ Paiement reçu
 * └─ Places BLOQUEES
 * └─ Client reçoit tickets
 * 
 * EMBARKED (Montée effectuée)
 * └─ Client a montéé dans le véhicule
 * └─ Tickets validés
 * 
 * CANCELLED (Annulée)
 * └─ Par client: ≤1h avant départ
 * └─ Par admin: n'importe quand (avec remboursement)
 * └─ Places libérées
 */
```

#### Annulation et Remboursement

```typescript
export async function adminCancelBooking(
  bookingId: string,
  reason: string,
  adminUserId: string
): Promise<void> {
  // 1. Récupère réservation
  const booking = await getBooking(bookingId);

  // 2. Crée remboursement si PAID
  if (booking.status === 'PAID') {
    const refund = await createRefund({
      booking_id: bookingId,
      amount: booking.total_price,
      reason,
      initiated_by: 'ADMIN',
      admin_user_id: adminUserId
    });
    // Attendre confirmation du fournisseur paiement
  }

  // 3. Libère places (tous les segments)
  await releaseBookingSeats(bookingId);

  // 4. Met à jour statut
  await updateBooking(bookingId, {
    status: 'CANCELLED',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason,
    cancelled_by: 'ADMIN'
  });

  // 5. Notifie client
  await notifyUser(booking.user_id, {
    type: 'BOOKING_CANCELLED',
    booking_id: bookingId,
    refund_amount: booking.total_price
  });
}
```

### D. PAIEMENTS ET REMBOURSEMENTS

#### Réconciliation Quotidienne

```typescript
export async function reconcilePayments(): Promise<ReconciliationReport> {
  const period = {
    start: startOfDay(subDays(new Date(), 1)),
    end: endOfDay(new Date())
  };

  // 1. Récupère transactions locales
  const localTransactions = await getPayments(period);

  // 2. Récupère transactions des fournisseurs
  const orangeTransactions = await orangeMoneyApi.getTransactions(period);
  const moovTransactions = await moovMoneyApi.getTransactions(period);

  // 3. Réconcilie
  const discrepancies: Discrepancy[] = [];

  for (const local of localTransactions) {
    const provider = local.method === 'ORANGE_MONEY'
      ? orangeTransactions
      : moovTransactions;

    const providerTx = provider.find(p => p.reference === local.provider_reference);

    if (!providerTx) {
      discrepancies.push({
        type: 'MISSING_IN_PROVIDER',
        transaction: local
      });
    } else if (providerTx.amount !== local.amount) {
      discrepancies.push({
        type: 'AMOUNT_MISMATCH',
        transaction: local,
        expected: local.amount,
        actual: providerTx.amount
      });
    }
  }

  return { period, discrepancies, balanced: discrepancies.length === 0 };
}
```

### E. ANALYTICS ET EXPORTS

#### Métriques Clés

```typescript
export interface AdminMetrics {
  // Volumes
  total_bookings_24h: number;
  active_trips_now: number;
  active_operators: number;

  // Finances
  total_revenue_24h: number;
  pending_payments: number;
  refunds_pending: number;

  // Qualité
  cancellation_rate_24h: number;  // %
  avg_trip_occupancy: number;      // %
  payment_success_rate: number;     // %

  // Alertes
  expired_holds_pending_release: number;
  operators_pending_approval: number;
  documents_expiring_soon: number;
}
```

#### Export de Données

```typescript
export async function exportBookings(
  format: 'csv' | 'xlsx',
  filters: BookingFilter
): Promise<Blob> {
  const bookings = await getBookings(filters);

  const data = bookings.map(b => ({
    'ID': b.booking_id,
    'Utilisateur': b.user_id,
    'Trajet': b.trip_id,
    'Sièges': b.seats.join(','),
    'Montant': b.total_price,
    'Statut': b.status,
    'Date': formatDate(b.created_at),
    'Paiement': b.payment_method
  }));

  if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet);
    return workbook;
  } else {
    // CSV export
    return convertToCSV(data);
  }
}
```

---

## Intégration avec l'App Mobile

### Partage de Code

```typescript
// Partage des types et services
mobile/src/data/models.ts ← (partagé avec admin)
mobile/src/lib/api.ts ← (peut être réutilisé)
mobile/src/lib/i18n.ts ← (partagé pour FR/EN/MO)

// Intégration
admin/src/data/models.ts ← même source
admin/src/lib/api.ts ← extensions des endpoints Mobile
```

### Endpoints API Séparés

```
# Endpoints Mobile (User)
GET /api/trips
GET /api/stations
POST /api/bookings/hold
POST /api/bookings/confirm
GET /api/tickets

# Endpoints Admin (Require Auth + Permission)
POST  /api/admin/trips
PATCH /api/admin/trips/:id
DELETE /api/admin/trips/:id
POST  /api/admin/operators
PATCH /api/admin/operators/:id
DELETE /api/admin/operators/:id
POST  /api/admin/bookings/:id/cancel
POST  /api/admin/users
PATCH /api/admin/users/:id
GET   /api/admin/analytics
POST  /api/admin/export
```

### Autorisation Granulaire

```typescript
// Middleware API
export function adminAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const adminUser = verifyToken(token);

  if (!adminUser) return res.status(401).json({ error: 'Unauthorized' });

  const requiredPermission = ROUTE_PERMISSIONS[req.path];
  if (!hasPermission(adminUser, requiredPermission)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.adminUser = adminUser;
  next();
}
```

---

## Recommandations Finales

### Développement Progressif

```
Phase 1 (Semaine 1-2):
├── Setup projet + Auth
├── Dashboard basique
└── Pages CRUD opérateurs/gares

Phase 2 (Semaine 3-4):
├── Gestion complète trajets
├── Gestion réservations
└── Formulaires avancés

Phase 3 (Semaine 5-6):
├── Analytics/Reports
├── Exports données
└── Paiements/Remboursements

Phase 4 (Semaine 7-8):
├── Support/Tickets chat
├── Gestion utilisateurs
└── Testing + Optimisations
```

### Points d'Attention

1. **Sécurité**: Toutes les opérations admin nécessitent authentification + permission
2. **DataSync Mobile**: Les changements admin doivent se propager à Mobile via API
3. **Notifications**: Alerts temps réel pour événements critiques
4. **Audit Logs**: Tracer toutes les actions admin pour compliance
5. **Performance**: Pagination obligatoire pour gros datasets
6. **Responsivité**: Admin doit fonctionner desktop + tablette

---

**FIN DE SPECIFICATION**
