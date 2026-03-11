# 🔬 ANALYSE APPROFONDIE COMPLÈTE - SPEC vs IMPLÉMENTATION

**Date:** 12 février 2026  
**Type:** Audit Technique Exhaustif  
**Statut:** ⚠️ CRITIQUE - Écarts majeurs détectés

---

## 📊 SCORE GLOBAL DE CONFORMITÉ

| Catégorie | Spec | Implémentation | Score | Gravité |
|-----------|------|----------------|-------|---------|
| **Architecture** | Pattern onNavigate/pages | Context + switch pages | 30% | 🔴 CRITIQUE |
| **Navigation** | RouterProvider/routes.ts | useState + switch/case | 20% | 🔴 CRITIQUE |
| **Authentification** | MFA, roles, permissions | Login basique | 15% | 🔴 CRITIQUE |
| **Services API** | Backend-ready avec fallback | Mock avec commentaires | 40% | 🔴 CRITIQUE |
| **Composants** | Formulaires complets | UI shells vides | 25% | 🔴 CRITIQUE |
| **Hooks** | Logique métier réutilisable | Wrappers services simples | 50% | 🟡 MOYEN |
| **Types** | Cohérents et complets | Partiels et mélangés | 60% | 🟡 MOYEN |
| **Logique Métier** | Règles critiques | Absentes | 10% | 🔴 CRITIQUE |

**Score total:** **31/100** 🔴

---

## 1️⃣ ARCHITECTURE & PATTERN DE NAVIGATION

### ❌ ÉCART MAJEUR: Pattern complètement différent

#### 📋 **SPEC Attendue:**

```typescript
// SPEC: React Router Data Mode Pattern
// App.tsx
import { RouterProvider } from 'react-router';
import { router } from './routes';

function App() {
  return <RouterProvider router={router} />;
}

// routes.ts
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "trips", Component: TripsListPage },
      { path: "trips/create", Component: TripsCreatePage },
      { path: "operators", Component: OperatorsListPage },
      // ...
    ],
  },
]);

// Pattern de page
interface PageProps {
  onNavigate: (page: AdminPage, data?: any) => void;
  onBack?: () => void;
  data?: any;
}
```

#### 🔴 **RÉALITÉ Implémentée:**

```typescript
// App.tsx - AUCUN ROUTER
export default function App() {
  return (
    <AdminAppProvider>
      <div className="min-h-screen">
        <AppContent />  {/* Login ou Dashboard selon auth */}
      </div>
    </AdminAppProvider>
  );
}

// Dashboard.tsx - Switch/case primitif
export type Page = 'dashboard' | 'map' | 'support' | ...;

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardHome />;
      case 'companies': return <TransportCompanyManagement />;
      // ... 25+ cases
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main>{renderPage()}</main>
    </div>
  );
}
```

### 🔍 **ANALYSE:**

| Aspect | SPEC | IMPLÉMENTATION | Impact |
|--------|------|----------------|--------|
| **Routing** | React Router avec URLs | useState + switch | ❌ Pas d'URLs, pas de deep linking |
| **Navigation** | `onNavigate(page, data)` | `setCurrentPage(page)` | ❌ Pas de passage de données |
| **Historique** | Browser back/forward | N/A | ❌ Pas de navigation browser |
| **Pages isolées** | Chaque page = component séparé | Tous dans Dashboard.tsx | ❌ Couplage fort |
| **Lazy loading** | Route-based splitting | Manual Suspense | 🟡 Partiellement fait |

### 💥 **PROBLÈMES CRITIQUES:**

1. **Pas d'URLs:** Impossible de bookmarker, partager, ou accéder directement à une page
2. **Pas de passage de données:** Comment éditer un opérateur? `onNavigate('operators-edit', operatorId)` impossible
3. **Pas d'historique:** Le bouton "retour" du navigateur ne fonctionne pas
4. **Composants non réutilisables:** Tous les composants dépendent du switch/case central
5. **Pas de nested routes:** Impossible d'avoir `/operators/:id/vehicles`

### ✅ **CE QUI DEVRAIT EXISTER:**

```typescript
// routes.ts
createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "companies", element: <CompaniesListPage /> },
      { path: "companies/create", element: <CompanyCreatePage /> },
      { path: "companies/:id", element: <CompanyDetailPage /> },
      { path: "companies/:id/edit", element: <CompanyEditPage /> },
      { path: "operators", element: <OperatorsListPage /> },
      { path: "operators/:id", element: <OperatorDetailPage /> },
      // ... vraie hiérarchie
    ]
  }
]);

// Usage dans composants
const navigate = useNavigate();
navigate('/companies/create');
navigate('/companies/abc123/edit');
```

---

## 2️⃣ AUTHENTIFICATION & AUTORISATIONS

### ❌ ÉCART MAJEUR: Système incomplet et non fonctionnel

#### 📋 **SPEC Attendue:**

```typescript
// Context avec rôles et permissions
interface AdminUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'OPERATOR_ADMIN' | 'SUPPORT_ADMIN' | 'FINANCE_ADMIN';
  permissions: Permission[];
  operator_id?: string;
  mfa_enabled: boolean;
}

interface Permission {
  resource: 'TRIPS' | 'OPERATORS' | ...;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  scope: 'ALL' | 'OWN_OPERATOR';
}

// Hook de vérification
const { hasPermission } = usePermission();
if (hasPermission('TRIPS', 'CREATE')) {
  // Afficher bouton créer
}

// Composant guard
<PermissionGuard resource="OPERATORS" action="DELETE">
  <Button>Supprimer</Button>
</PermissionGuard>
```

#### 🔴 **RÉALITÉ Implémentée:**

```typescript
// AdminAppContext.tsx
interface AdminAppContextType {
  isAuthenticated: boolean;
  currentUser: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // ... AUCUNE mention de permissions ou rôles
}

// Login basique
const login = async (email: string, password: string) => {
  const user = MOCK_ADMIN_USERS.find(
    u => u.email === email && u.password === password
  );
  if (user) {
    setCurrentUser(user);
    setIsAuthenticated(true);
  }
};

// AUCUN système de permissions implémenté
```

#### 📁 **Fichier usePermission.ts**

```typescript
// lib/usePermission.ts - EXISTE mais NON UTILISÉ
export function usePermission() {
  const { currentUser } = useAdminApp();

  const hasPermission = (resource: string, action: string) => {
    // TODO: Implement permission check
    return true;  // ⚠️ TOUJOURS TRUE
  };

  return { hasPermission };
}
```

### 🔍 **ANALYSE:**

| Feature | SPEC | IMPLÉMENTATION | Status |
|---------|------|----------------|--------|
| **Rôles prédéfinis** | SUPER_ADMIN, OPERATOR_ADMIN, etc. | ❌ Non définis | Absent |
| **Permissions granulaires** | Resource + Action + Scope | ❌ Non implémenté | Absent |
| **Hook hasPermission** | Fonctionnel avec vérification | 🟡 Existe mais return true | Inutile |
| **PermissionGuard** | Component pour conditional rendering | ❌ Existe mais non utilisé | Absent |
| **MFA** | Multi-factor auth obligatoire | ❌ Non implémenté | Absent |
| **Session timeout** | Expiration après inactivité | ❌ Non géré | Absent |
| **Scope filtering** | OPERATOR_ADMIN voit que ses données | ❌ Tout le monde voit tout | Absent |

### 💥 **PROBLÈMES CRITIQUES:**

1. **Sécurité inexistante:** N'importe qui connecté peut tout faire
2. **Pas de séparation des rôles:** Un SUPPORT_ADMIN peut supprimer des opérateurs
3. **Pas de MFA:** Vulnérable aux attaques
4. **Pas de scope:** Un OPERATOR_ADMIN voit les données de tous les opérateurs
5. **Token non géré:** Pas de refresh token, pas de validation JWT

### ✅ **CE QUI DEVRAIT EXISTER:**

```typescript
// lib/permissions.ts
export const ROLES = {
  SUPER_ADMIN: {
    permissions: ['*']  // Tous accès
  },
  OPERATOR_ADMIN: {
    permissions: [
      { resource: 'TRIPS', action: 'CREATE', scope: 'OWN_OPERATOR' },
      { resource: 'TRIPS', action: 'READ', scope: 'OWN_OPERATOR' },
      { resource: 'BOOKINGS', action: 'READ', scope: 'OWN_OPERATOR' },
    ]
  },
  SUPPORT_ADMIN: {
    permissions: [
      { resource: 'TICKETS', action: 'READ', scope: 'ALL' },
      { resource: 'TICKETS', action: 'UPDATE', scope: 'ALL' },
      { resource: 'BOOKINGS', action: 'UPDATE', scope: 'ALL' },
    ]
  }
};

// Hook fonctionnel
export function usePermission() {
  const { currentUser } = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;

    return currentUser.permissions.some(
      p => p.resource === resource && p.action === action
    );
  };

  return { hasPermission, currentUser };
}

// Usage RÉEL
function TripsPage() {
  const { hasPermission } = usePermission();

  return (
    <>
      {hasPermission('TRIPS', 'CREATE') && (
        <Button>Créer trajet</Button>
      )}
      <TripsList 
        canEdit={hasPermission('TRIPS', 'UPDATE')}
        canDelete={hasPermission('TRIPS', 'DELETE')}
      />
    </>
  );
}
```

---

## 3️⃣ SERVICES API - Backend Ready?

### ❌ ÉCART MAJEUR: "Backend-ready" mais pas vraiment

#### 📋 **SPEC Attendue:**

```typescript
// admin-api.ts - Endpoints admin complets
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
  // ... vraie implémentation fetch
}

export async function cancelBooking(bookingId: string, reason: string): Promise<void> {
  // ... vraie implémentation
}

// Services métier avec validation
export class TripsService {
  static async createTrip(data: CreateTripRequest): Promise<Trip> {
    // 1. Valider données
    const errors = await this.validateTripData(data);
    if (errors.length > 0) throw new ValidationError(errors);

    // 2. Appel API
    return adminApi.createTrip(data);
  }

  static async validateTripData(data: CreateTripRequest): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Règle: available_seats = MIN(segments)
    const minCapacity = Math.min(...data.segments.map(s => s.available_seats));
    if (data.available_seats !== minCapacity) {
      errors.push({
        field: 'available_seats',
        message: `Doit être ${minCapacity} (minimum des segments)`
      });
    }

    return errors;
  }
}
```

#### 🔴 **RÉALITÉ Implémentée:**

```typescript
// apiService.ts - Service générique
class ApiService {
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    if (this.isMockMode) {
      console.warn('Mock mode: returning empty data');
      return { success: true, data: [] as any };
    }

    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.buildHeaders(config?.headers);

    // ... implémentation fetch générique
  }
}

// entitiesService.ts - Wrappers basiques
class TransportCompaniesService {
  async approve(id: string): Promise<ApiResponse<TransportCompany>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(c => c.id === id);
      if (index !== -1) {
        this.mockData[index] = { ...this.mockData[index], status: 'active' };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Société non trouvée' };
    }
    // Backend: return await apiService.post(`/admin/companies/${id}/approve`);
    
    // ⚠️ PROBLÈME: Le code "backend" fait la même chose que mock
    const index = this.mockData.findIndex(c => c.id === id);
    if (index !== -1) {
      this.mockData[index] = { ...this.mockData[index], status: 'active' };
      return { success: true, data: this.mockData[index] };
    }
    return { success: false, error: 'Société non trouvée' };
  }
}
```

### 🔍 **ANALYSE:**

| Aspect | SPEC | IMPLÉMENTATION | Conformité |
|--------|------|----------------|------------|
| **Endpoints spécifiques** | `/admin/trips`, `/admin/bookings/:id/cancel` | ❌ Générique `.get()`, `.post()` | 20% |
| **Validation métier** | Règles critiques (capacité, dates) | ❌ Aucune validation | 0% |
| **Gestion d'erreurs** | Types d'erreurs spécifiques | 🟡 Générique | 40% |
| **Retry logic** | Implémenté | ✅ Existe | 100% |
| **Cache** | Par endpoint | ✅ Existe | 100% |
| **Types Request/Response** | Spécifiques par endpoint | ❌ Génériques | 30% |

### 💥 **PROBLÈMES CRITIQUES:**

1. **Pas d'endpoints admin spécifiques:** Tout passe par des `.get()`, `.post()` génériques
2. **Aucune validation métier:** Les règles critiques (capacité trajet = MIN segments) absentes
3. **Code "backend" identique au mock:** Les deux branches font pareil (muter mockData)
4. **Pas de types spécifiques:** `CreateTripRequest`, `UpdateBookingRequest` n'existent pas
5. **Services métier vides:** `TripsService`, `BookingsService` n'existent pas

### ✅ **CE QUI DEVRAIT EXISTER:**

```typescript
// services/api/trips.service.ts
export class TripsService {
  /**
   * RÈGLE CRITIQUE: available_seats = MIN(segments.available_seats)
   */
  static async createTrip(data: CreateTripRequest): Promise<Trip> {
    // 1. Validation
    const errors = this.validateTripData(data);
    if (errors.length > 0) {
      throw new ValidationError('Données invalides', errors);
    }

    // 2. Calcul automatique de la capacité
    const capacity = Math.min(...data.segments.map(s => s.available_seats));
    const finalData = { ...data, available_seats: capacity };

    // 3. Appel API
    return await adminApi.createTrip(finalData);
  }

  static validateTripData(data: CreateTripRequest): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.from_stop_id) {
      errors.push({ field: 'from_stop_id', message: 'Départ requis' });
    }

    if (new Date(data.departure_time) >= new Date(data.arrival_time)) {
      errors.push({ 
        field: 'arrival_time', 
        message: 'Arrivée doit être après départ' 
      });
    }

    // Règle métier critique
    const minCapacity = Math.min(...data.segments.map(s => s.available_seats));
    if (data.available_seats !== minCapacity) {
      errors.push({
        field: 'available_seats',
        message: `Doit être ${minCapacity} (capacité minimale des segments)`
      });
    }

    return errors;
  }
}

// admin-api.ts - Endpoints typés
export async function createTrip(data: CreateTripRequest): Promise<Trip> {
  return await apiClient.post<Trip>('/admin/trips', data);
}

export async function cancelBooking(
  bookingId: string, 
  reason: string
): Promise<CancellationResult> {
  return await apiClient.post<CancellationResult>(
    `/admin/bookings/${bookingId}/cancel`,
    { reason }
  );
}
```

---

## 4️⃣ MODÈLES DE DONNÉES & TYPES

### 🟡 ÉCART MOYEN: Types partiels et incohérents

#### 📋 **SPEC Attendue:**

```typescript
// data/models.ts - Types PARTAGÉS Mobile + Admin
export interface Trip {
  trip_id: string;
  operator_id: string;
  from_stop_id: string;
  to_stop_id: string;
  departure_time: string;  // ISO 8601
  arrival_time: string;
  available_seats: number;  // ⚠️ RÈGLE: min(segments[].available_seats)
  price_per_seat: number;
  vehicle_type: 'MINIBUS' | 'BUS' | 'VAN';
  amenities: string[];
  segments: Segment[];
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
}

export interface Segment {
  segment_id: string;
  from_stop_id: string;
  to_stop_id: string;
  distance_km: number;
  duration_minutes: number;
  available_seats: number;  // Capacité dynamique
}

// types/admin.ts - Types SPÉCIFIQUES admin
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
```

#### 🔴 **RÉALITÉ Implémentée:**

```typescript
// shared/types/standardized.ts - Mix de types
export interface TransportCompany {
  id: string;  // ⚠️ Pas trip_id comme spec
  operator_id?: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'pending' | 'suspended';
  logo?: string;
  rating?: number;
  vehicleCount?: number;
  totalTrips?: number;
  // ... pas de segments, pas de vehicle_type
}

export interface PassengerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  totalBookings: number;
  phoneVerified: boolean;
  emailVerified: boolean;
  // ... types OK
}

// ❌ ABSENT: CreateTripRequest, UpdateTripRequest, etc.
```

### 🔍 **ANALYSE:**

| Type | SPEC | IMPLÉMENTATION | Cohérence |
|------|------|----------------|-----------|
| **Trip** | Complet avec segments | ❌ Basique sans segments | 40% |
| **Segment** | Défini avec capacité | ❌ Absent | 0% |
| **Operator vs TransportCompany** | Distinct (opérateur ≠ société) | 🟡 Mélangé | 50% |
| **CreateXxxRequest** | Types séparés pour création | ❌ Absents | 0% |
| **Permission** | Type explicite | ❌ Absent | 0% |
| **AdminUser avec roles** | Type complet | 🟡 Partiel | 60% |

### 💥 **PROBLÈMES CRITIQUES:**

1. **Confusion Operator vs TransportCompany:**
   - SPEC: Un **TransportCompany** a plusieurs **Operators** (employés)
   - CODE: Tout est `TransportCompany` sans distinction

2. **Segments absents:**
   - SPEC: Un trajet a des **segments** (Ouaga → Koudougou → Bobo)
   - CODE: Aucune notion de segment

3. **Pas de types Request:**
   - SPEC: `CreateTripRequest`, `UpdateBookingRequest`, etc.
   - CODE: On passe des `Partial<Trip>` génériques

4. **IDs incohérents:**
   - SPEC: `trip_id`, `operator_id`, `booking_id` (snake_case)
   - CODE: Mélange de `id`, `operator_id`, `operatorId` (incohérent)

### ✅ **CE QUI DEVRAIT EXISTER:**

```typescript
// Distinction claire
export interface TransportCompany {
  company_id: string;
  name: string;
  operators: Operator[];  // Employés de la société
  vehicles: Vehicle[];
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
}

export interface Operator {
  operator_id: string;
  company_id: string;
  name: string;
  role: 'ADMIN' | 'DRIVER' | 'CASHIER';
}

// Types Request/Response séparés
export interface CreateTripRequest {
  operator_id: string;
  vehicle_id: string;
  from_stop_id: string;
  to_stop_id: string;
  departure_time: string;
  arrival_time: string;
  segments: CreateSegmentRequest[];
  price_per_seat: number;
}

export interface CreateSegmentRequest {
  from_stop_id: string;
  to_stop_id: string;
  stop_order: number;
  distance_km: number;
  duration_minutes: number;
  available_seats: number;
}
```

---

## 5️⃣ PAGES & COMPOSANTS

### ❌ ÉCART MAJEUR: UI Shells sans logique fonctionnelle

#### 📋 **SPEC: Page Création Trajet**

```typescript
// pages/trips/TripsEditPage.tsx
export function TripsEditPage({ onNavigate, data: tripId }: PageProps) {
  const { trip, isLoading } = useTripById(tripId);
  const form = useForm<CreateTripRequest>({
    resolver: zodResolver(createTripSchema)  // Validation Zod
  });

  const handleSave = async (data: CreateTripRequest) => {
    // 1. Validation métier
    const errors = TripsService.validateTripData(data);
    if (errors.length > 0) {
      // Afficher erreurs
      return;
    }

    // 2. Calcul auto capacité
    const capacity = Math.min(...data.segments.map(s => s.available_seats));

    // 3. Sauvegarde
    await TripsService.updateTrip(tripId, { ...data, available_seats: capacity });
    
    // 4. Retour
    onNavigate('trips');
  };

  return (
    <form onSubmit={form.handleSubmit(handleSave)}>
      {/* Section Informations */}
      <Card>
        <OperatorSelect {...form.register('operator_id')} />
        <VehicleSelect {...form.register('vehicle_id')} />
        <StationSelect {...form.register('from_stop_id')} />
        <StationSelect {...form.register('to_stop_id')} />
      </Card>

      {/* Section Segments - CRITIQUE */}
      <SegmentEditor
        segments={form.watch('segments')}
        onChange={(segments) => form.setValue('segments', segments)}
      />

      {/* Affichage capacité calculée */}
      <Alert>
        Capacité totale: {Math.min(...segments.map(s => s.available_seats))} places
      </Alert>

      <Button type="submit">Enregistrer</Button>
    </form>
  );
}
```

#### 🔴 **RÉALITÉ: Page Gestion Trajets**

```typescript
// components/dashboard/TripManagement.tsx
export function TripManagement() {
  const { trips } = useAdminApp();  // Renvoie [] vide en mock
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-8">
      <h1>Gestion des Trajets</h1>
      
      {/* Barre recherche */}
      <Input 
        placeholder="Rechercher..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Tableau vide */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Départ</TableCell>
            <TableCell>Arrivée</TableCell>
            <TableCell>Places</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trips.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>Aucun trajet</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* ⚠️ PAS DE: */}
      {/* - Bouton "Créer trajet" */}
      {/* - Modal de création */}
      {/* - Formulaire de modification */}
      {/* - Gestion des segments */}
      {/* - Validation métier */}
    </div>
  );
}
```

### 🔍 **ANALYSE PAGE PAR PAGE:**

| Page | SPEC | IMPLÉMENTATION | Fonctionnalité |
|------|------|----------------|----------------|
| **TripsListPage** | Tableau + CRUD complet | 🟡 Tableau basique | 30% |
| **TripsCreatePage** | Formulaire multi-étapes | ❌ Absent | 0% |
| **TripsEditPage** | Formulaire pré-rempli | ❌ Absent | 0% |
| **SegmentEditor** | Éditeur de segments | ❌ Absent | 0% |
| **OperatorsListPage** | Tableau + approbation | 🟡 Tableau simple | 40% |
| **OperatorDetailPage** | Vue détaillée 360° | ❌ Absent | 0% |
| **BookingsListPage** | Filtres + actions | 🟡 Tableau basique | 35% |
| **BookingDetailPage** | Détail + annulation | ❌ Absent | 0% |
| **AnalyticsPage** | Graphiques + exports | 🟡 Graphiques mock | 50% |
| **SupportPage** | Tickets + chat | 🟡 Liste tickets | 30% |

### 💥 **PROBLÈMES CRITIQUES:**

1. **Pas de formulaires de création/édition:**
   - Spec: Pages séparées pour Create/Edit avec validation
   - Code: Seulement des listes avec boutons non fonctionnels

2. **Pas de pages de détail:**
   - Spec: Vue 360° d'un opérateur (véhicules, trajets, finances)
   - Code: Clic sur une ligne ne fait rien

3. **Composants critiques manquants:**
   - `SegmentEditor`: Éditer les étapes d'un trajet
   - `CapacityManager`: Gérer disponibilités par segment
   - `RefundDialog`: Rembourser un client
   - `DocumentUpload`: Upload documents opérateur

4. **Aucune validation:**
   - Spec: Validation Zod + règles métier
   - Code: Aucune validation (formulaires acceptent n'importe quoi)

5. **Actions non implémentées:**
   - Boutons "Approuver", "Suspendre", "Modifier" → ne font rien
   - Modal de confirmation → absente
   - Feedback utilisateur → basique (toast seulement)

---

## 6️⃣ LOGIQUE MÉTIER - RÈGLES CRITIQUES

### ❌ ÉCART CRITIQUE: Règles métier absentes

#### 📋 **SPEC: Règles Critiques Trajets**

```typescript
/**
 * RÈGLE 1: Disponibilité = MIN des segments
 * 
 * Un trajet Ouaga → Bobo se décompose en segments:
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
 * RÈGLE 2: Réservation affecte segments traversés uniquement
 * 
 * Passager réserve Ouaga → Koudougou:
 * - Segment Ouaga → Koudougou: -1 place
 * - Segment Koudougou → Bobo: INCHANGÉ (pas traversé)
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
    delta: action === 'release' ? +1 : -1
  }));
}
```

#### 🔴 **RÉALITÉ Implémentée:**

```typescript
// ❌ AUCUNE règle métier implémentée
// Pas de segments dans le modèle Trip
// Pas de fonction validateCapacity
// Pas de fonction getPassengerSegments
// Pas de logique de mise à jour des disponibilités
```

### 🔍 **RÈGLES MÉTIER MANQUANTES:**

#### 1. **Trajets & Segments**

| Règle | Description | Implémentation |
|-------|-------------|----------------|
| Capacité = MIN(segments) | Trajet dispo = segment le plus contraint | ❌ Absent |
| Segments en ordre | stop_order croissant | ❌ Absent |
| Distance cohérente | Somme segments = distance totale | ❌ Absent |
| Pas de segment vide | Tous segments ≥ 1 place | ❌ Absent |

#### 2. **Réservations**

| Règle | Description | Implémentation |
|-------|-------------|----------------|
| Hold TTL 10min | Réservation expire après 10min | ❌ Absent |
| Places bloquées pendant HOLD | Autres ne peuvent pas réserver | ❌ Absent |
| Annulation ≤1h avant départ | Client peut annuler max 1h avant | ❌ Absent |
| Remboursement auto si admin annule | Admin annule = remboursement | ❌ Absent |

#### 3. **Paiements**

| Règle | Description | Implémentation |
|-------|-------------|----------------|
| Réconciliation quotidienne | Comparaison local vs provider | ❌ Absent |
| Refund max = booking amount | Pas de remboursement > montant payé | ❌ Absent |
| Status PENDING timeout 30min | Paiement échoue après 30min | ❌ Absent |

#### 4. **Opérateurs**

| Règle | Description | Implémentation |
|-------|-------------|----------------|
| Documents expirés = suspension | Licence expirée = suspension auto | ❌ Absent |
| Approval checklist | 5 étapes de validation avant approbation | ❌ Absent |
| Suspension = annulation trajets | Trajets futurs annulés si suspension | ❌ Absent |

### 💥 **IMPACT:**

Sans ces règles, l'application:
- ✅ Affiche de belles listes
- ❌ Ne peut PAS gérer de vrais trajets avec étapes
- ❌ Ne peut PAS gérer les disponibilités correctement
- ❌ Ne peut PAS annuler proprement une réservation
- ❌ Ne respecte PAS les contraintes métier du transport

---

## 7️⃣ HOOKS PERSONNALISÉS

### 🟡 ÉCART MOYEN: Hooks existants mais simplistes

#### 📋 **SPEC Attendue:**

```typescript
// hooks/useTrips.ts - Hook avec logique métier
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
      setError(null);
      
      // Appel service avec filtre
      const response = await TripsService.getAll(filter);
      
      // Validation des données reçues
      const validated = response.data.map(trip => {
        if (!validateCapacity(trip)) {
          console.warn(`Trip ${trip.trip_id} has invalid capacity`);
        }
        return trip;
      });

      setTrips(validated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  // Actions métier
  const createTrip = async (data: CreateTripRequest) => {
    const trip = await TripsService.createTrip(data);
    setTrips(prev => [...prev, trip]);
    return trip;
  };

  const updateTrip = async (id: string, data: UpdateTripRequest) => {
    const updated = await TripsService.updateTrip(id, data);
    setTrips(prev => prev.map(t => t.trip_id === id ? updated : t));
    return updated;
  };

  return { 
    trips, 
    isLoading, 
    error, 
    refetch: fetchTrips,
    createTrip,
    updateTrip 
  };
}
```

#### 🔴 **RÉALITÉ Implémentée:**

```typescript
// hooks/useEntities.ts - Wrapper générique
export function useTransportCompanies() {
  const [data, setData] = useState<TransportCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const response = await transportCompaniesService.getAll();
    if (response.success) {
      setData(response.data || []);
    }
    setLoading(false);
  };

  return { 
    companies: data, 
    loading, 
    refetch: fetchData 
  };
}

// ⚠️ PAS DE:
// - Validation des données
// - Actions métier (create, update)
// - Gestion d'erreurs détaillée
// - Filtres
```

### 🔍 **ANALYSE:**

| Feature Hook | SPEC | IMPLÉMENTATION | Qualité |
|--------------|------|----------------|---------|
| **Fetch data** | ✅ | ✅ | 100% |
| **Loading state** | ✅ | ✅ | 100% |
| **Error handling** | Détaillé | 🟡 Basique | 40% |
| **Actions CRUD** | createX, updateX, deleteX | ❌ Absent | 0% |
| **Filtres** | filter param | ❌ Absent | 0% |
| **Validation** | Règles métier | ❌ Absent | 0% |
| **Cache** | Optimistic updates | ❌ Absent | 0% |
| **Retry** | Auto retry on error | ❌ Absent | 0% |

### ✅ **CE QUI DEVRAIT EXISTER:**

```typescript
// Hook complet avec actions
export function useBookings(filter?: BookingFilter) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch avec filtre
  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await BookingsService.getAll(filter);
      setBookings(response.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Actions métier
  const cancelBooking = async (bookingId: string, reason: string) => {
    await BookingsService.cancel(bookingId, reason);
    
    // Optimistic update
    setBookings(prev => 
      prev.map(b => 
        b.booking_id === bookingId 
          ? { ...b, status: 'CANCELLED' }
          : b
      )
    );
  };

  const refundBooking = async (bookingId: string, amount: number) => {
    await BookingsService.refund(bookingId, amount);
    await fetchBookings();  // Refetch pour voir le remboursement
  };

  return {
    bookings,
    isLoading,
    error,
    refetch: fetchBookings,
    cancelBooking,
    refundBooking
  };
}
```

---

## 8️⃣ EXPÉRIENCE UTILISATEUR (UX)

### 🔴 ÉCART MAJEUR: Feedback et guidage insuffisants

#### 📋 **SPEC Attendue:**

```typescript
// Feedback riche
export function OperatorApprovalFlow() {
  const [step, setStep] = useState<'review' | 'checklist' | 'confirm'>('review');

  return (
    <Dialog>
      {/* Étape 1: Review documents */}
      {step === 'review' && (
        <>
          <h2>Documents à vérifier</h2>
          <DocumentViewer documents={operator.documents} />
          <Button onClick={() => setStep('checklist')}>
            Suivant
          </Button>
        </>
      )}

      {/* Étape 2: Checklist obligatoire */}
      {step === 'checklist' && (
        <>
          <h2>Checklist de validation</h2>
          <CheckboxGroup>
            <Checkbox>✅ Licence de transport valide</Checkbox>
            <Checkbox>✅ Assurance véhicules à jour</Checkbox>
            <Checkbox>✅ Registre de commerce vérifié</Checkbox>
            <Checkbox>✅ Coordonnées vérifiées</Checkbox>
            <Checkbox>✅ Véhicules conformes</Checkbox>
          </CheckboxGroup>
          <Button onClick={() => setStep('confirm')}>
            Valider
          </Button>
        </>
      )}

      {/* Étape 3: Confirmation finale */}
      {step === 'confirm' && (
        <Alert variant="warning">
          ⚠️ Vous approuvez <strong>{operator.name}</strong>.
          Cette action est <strong>irréversible</strong> et donnera accès 
          à la plateforme.
          <Button onClick={handleApprove}>
            Confirmer l'approbation
          </Button>
        </Alert>
      )}
    </Dialog>
  );
}
```

#### 🔴 **RÉALITÉ Implémentée:**

```typescript
// Feedback minimal
export function TransportCompanyManagement() {
  const handleApprove = (companyId: string) => {
    approveCompany(companyId);  // Pas de confirmation
    toast.success('Société approuvée');  // Toast basique
  };

  return (
    <Table>
      {companies.map(company => (
        <TableRow>
          <TableCell>{company.name}</TableCell>
          <TableCell>
            <Button onClick={() => handleApprove(company.id)}>
              Approuver
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
```

### 🔍 **ANALYSE UX:**

| Aspect UX | SPEC | IMPLÉMENTATION | Score |
|-----------|------|----------------|-------|
| **Feedback actions** | Multi-étapes avec confirmation | 🔴 Toast basique | 20% |
| **États de chargement** | Skeletons, spinners contextuels | 🟡 Spinner global | 50% |
| **Gestion d'erreurs** | Messages spécifiques + recovery | 🔴 Toast "Erreur" | 30% |
| **Guidage utilisateur** | Wizards, tooltips, aide | ❌ Absent | 0% |
| **Breadcrumbs** | Navigation hiérarchique | ❌ Absent | 0% |
| **Undo/Redo** | Annuler actions critiques | ❌ Absent | 0% |
| **Keyboard shortcuts** | Navigation clavier | ❌ Absent | 0% |
| **Responsive** | Desktop + Tablet | 🟡 Desktop only | 60% |

### 💥 **PROBLÈMES UX CRITIQUES:**

1. **Actions irréversibles sans confirmation:**
   - Clic "Supprimer" → supprime directement
   - Pas de "Êtes-vous sûr?"
   - Pas d'explication de l'impact

2. **Pas de guidage:**
   - Créer un trajet: pas d'assistant étape par étape
   - Pas de tooltips expliquant les champs
   - Pas de validation inline (erreurs seulement au submit)

3. **Erreurs génériques:**
   - "Erreur lors de la sauvegarde" (quelle erreur?)
   - Pas de proposition de solution
   - Pas de retry automatique

4. **Pas de contexte:**
   - Impossible de savoir où on est (pas de breadcrumbs)
   - Pas d'historique de navigation
   - Pas de "dernières actions"

---

## 9️⃣ DETTE TECHNIQUE IDENTIFIÉE

### 🔴 **CRITIQUE - À REFACTORISER IMMÉDIATEMENT:**

1. **Navigation (Pattern fondamental)**
   - Remplacer switch/case par React Router
   - Implémenter vraies URLs
   - Passage de données entre pages

2. **Authentification & Permissions**
   - Implémenter vraies permissions
   - Système de rôles fonctionnel
   - MFA

3. **Services API**
   - Créer endpoints spécifiques admin
   - Types Request/Response par endpoint
   - Validation métier dans services

4. **Logique métier trajets**
   - Implémenter segments
   - Règle capacité = MIN(segments)
   - Gestion des réservations par segment

### 🟡 **IMPORTANT - À AMÉLIORER:**

5. **Formulaires**
   - Créer formulaires Create/Edit pour chaque entité
   - Validation Zod
   - Feedback inline

6. **Pages de détail**
   - Vue 360° des entités
   - Onglets (Info, Documents, Historique, etc.)
   - Actions contextuelles

7. **Composants critiques**
   - SegmentEditor
   - CapacityManager
   - DocumentUpload
   - RefundDialog

8. **UX**
   - Confirmations actions critiques
   - Wizards pour workflows complexes
   - Breadcrumbs
   - États de chargement contextuels

---

## 🎯 CONCLUSION & RECOMMANDATIONS

### ⚠️ **STATUT ACTUEL:**

L'application Admin FasoTravel est une **MAQUETTE FONCTIONNELLE** (31/100) qui:
- ✅ Affiche des listes et des graphiques
- ✅ A une structure de code propre
- ❌ Ne permet PAS de gérer réellement un écosystème de transport
- ❌ Manque TOUTES les fonctionnalités critiques opérationnelles
- ❌ N'implémente AUCUNE règle métier du transport

### 📋 **PLAN DE RECONSTRUCTION URGENT:**

#### **PHASE 1 - FONDATIONS (Semaine 1)**
1. ✅ Implémenter React Router avec vraies URLs
2. ✅ Système de permissions fonctionnel
3. ✅ Types cohérents (Trip avec segments)
4. ✅ Services API avec endpoints spécifiques

#### **PHASE 2 - CŒUR MÉTIER (Semaines 2-3)**
5. ✅ Logique métier trajets (segments, capacité)
6. ✅ Formulaires CRUD complets
7. ✅ Pages de détail 360°
8. ✅ Validation métier dans services

#### **PHASE 3 - OPÉRATIONNEL (Semaine 4)**
9. ✅ Workflows complets (approbation, suspension)
10. ✅ Gestion réservations/annulations
11. ✅ Composants critiques (SegmentEditor, etc.)
12. ✅ Analytics et exports fonctionnels

#### **PHASE 4 - FINITION (Semaine 5)**
13. ✅ UX améliorée (wizards, confirmations)
14. ✅ Gestion d'erreurs robuste
15. ✅ Documentation utilisateur
16. ✅ Tests E2E

### 🚨 **DÉCISION REQUISE:**

**Option A:** Reconstruction complète (recommandé)
- Suivre les spécifications à 100%
- 5 semaines de développement focalisé
- Application réellement opérationnelle

**Option B:** Améliorations incrémentales
- Corriger les problèmes critiques un par un
- Risque de dettes techniques accumulées
- Temps total potentiellement plus long

---

**VERDICT FINAL:** L'application actuelle ne peut PAS être utilisée en production pour gérer un vrai écosystème de transport. Une reconstruction basée sur les spécifications est nécessaire.

---

**FIN DE L'ANALYSE APPROFONDIE**
