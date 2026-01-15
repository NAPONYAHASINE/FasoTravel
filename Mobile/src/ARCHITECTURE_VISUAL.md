# 🎨 ARCHITECTURE VISUELLE - NearbyPage API

## 📊 Flux de Données Global

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                                │
│  Utilisateur embarqué clique sur "Signaler un incident"                 │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      COMPONENT LAYER                                     │
│                   (/pages/NearbyPage.tsx)                               │
│                                                                         │
│  • onClick handler appelle handleSendIncidentReport()                  │
│  • Valide les données (description, location, trip)                    │
│  • Affiche modal et loading state                                      │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      HOOKS LAYER                                         │
│                   (/lib/hooks.ts)                                       │
│                                                                         │
│  const { reportIncident, isLoading, error } = useReportIncident()      │
│                                                                         │
│  • Appelle api.reportIncident(params)                                  │
│  • Gère try/catch                                                       │
│  • Update state: isLoading, error                                      │
│  • Retourne result ou null                                              │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     API SERVICE LAYER                                    │
│                      (/lib/api.ts)                                      │
│                                                                         │
│  export async function reportIncident(params)                          │
│                                                                         │
│  if (isDevelopment) {                                                  │
│    ├─ console.log('[MOCK] Incident Report:', params)                  │
│    ├─ setTimeout(500)                                                  │
│    └─ return mockResponse { incident_id, status, ... }                │
│  } else {                                                               │
│    ├─ fetch(`${BASE_URL}/incidents`, POST)                            │
│    ├─ Parse JSON response                                              │
│    └─ return response data                                              │
│  }                                                                      │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    ▼         ▼
             [DEV MODE]   [PROD MODE]
             Mock Data    Real Backend
```

---

## 🗂️ File Structure

```
MOBILE/
├── src/
│   ├── lib/
│   │   ├── api.ts ........................ ✅ Service Layer
│   │   │   ├── export reportIncident()
│   │   │   ├── export shareLocation()
│   │   │   ├── export interface IncidentReportParams
│   │   │   ├── export interface IncidentReportResponse
│   │   │   ├── export interface LocationShareParams
│   │   │   └── export interface LocationShareResponse
│   │   │
│   │   ├── hooks.ts ....................... ✅ Hooks Layer
│   │   │   ├── export useReportIncident()
│   │   │   └── export useShareLocation()
│   │   │
│   │   ├── API_STRUCTURE_GUIDE.md ......... 📖 Architecture Guide
│   │   ├── API_INTEGRATION_CHECKLIST.md .. ✅ Integration Checklist
│   │   ├── CODE_LOCATIONS_MAP.md ......... 🗺️ Code Locations
│   │   └── README_REFACTOR_SUMMARY.md ... 📝 Summary
│   │
│   ├── pages/
│   │   └── NearbyPage.tsx ................. ✅ Component Layer
│   │       ├── import useReportIncident
│   │       ├── import useShareLocation
│   │       ├── handleSendIncidentReport()
│   │       └── handleShareLocation()
│   │
│   ├── BEFORE_AFTER_COMPARISON.md ....... 🔄 Comparison
│   ├── QUICK_REFERENCE.md ............... 🚀 Quick Start
│   └── API_DOCUMENTATION_INDEX.md ....... 📚 Index
│
└── backend-examples/
    └── nearby-page-api-routes.js ........ 📚 Backend Examples
```

---

## 🔄 State Flow Diagram

```
Component State
│
├─ [showIncidentModal] ................... true/false
├─ [incidentText] ....................... "Accident on road"
├─ [reportingIncident] (from hook) ...... false → true → false
└─ [incidentError] (from hook) ......... null → "Error msg" → null
│
Processing Flow:
│
1. User types incident description
   ↓
2. User clicks "Send" button
   ↓
3. handleSendIncidentReport() called
   ├─ Validate input
   ├─ Call reportIncident() hook
   ├─ Hook sets isLoading = true
   │
4. Hook calls api.reportIncident()
   ├─ Check isDevelopment
   ├─ If DEV: mock response
   ├─ If PROD: fetch() to backend
   │
5. Hook receives response
   ├─ Hook sets isLoading = false
   ├─ Hook returns result
   │
6. Component handles result
   ├─ if result: show success
   ├─ else: show error
   │
7. Reset state
   ├─ Clear incidentText
   ├─ Close modal
   └─ Reset isLoading
```

---

## 📱 Component Render Tree

```
<NearbyPage>
│
├─ <FullscreenMapBackground>
│  └─ Map placeholder
│
├─ <FloatingButtons>
│  ├─ Back arrow (left)
│  └─ Search loupe (right)
│
└─ <DraggableBottomSheet>
   ├─ <SearchBar>
   ├─ <TrackingBanner> (if active)
   ├─ <PositionCard>
   ├─ <VehicleTrackingCard> (if EMBARKED)
   │  ├─ Position info
   │  ├─ Progress bar
   │  └─ <ActionButtons>
   │     ├─ <IncidentButton> ........... onClick → reportIncident
   │     └─ <ShareButton> ............. onClick → shareLocation
   │
   ├─ <IncidentModal> (if showIncidentModal)
   │  ├─ Textarea for description
   │  ├─ Cancel button
   │  └─ Send button .................. onClick → handleSendIncidentReport
   │
   └─ <StationsList>
      └─ List of nearby stations

HOOKS USED:
├─ useNearbyStations() ................. Get stations
├─ useVehicleLiveTracking() ............ Track vehicle
├─ useMyTickets() ...................... Check EMBARKED
├─ useReportIncident() ✨ NEW ......... Report incident
└─ useShareLocation() ✨ NEW .......... Share location
```

---

## 🔌 API Endpoints Map

```
Frontend           Hook Function           API Function            Backend Route
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│ <IncidentButton>                                                        │
│ onClick                    useReportIncident()                          │
│    │                       │                  reportIncident()          │
│    │                       │                  │                         │
│    └─→ handleSendIncident  │                  │                         │
│          Report()          │                  │         fetch()        │
│    │                       │                  │         │              │
│    └─→ await reportIncident()                │         ├─ POST       │
│          with params       │                  │         │  /api/      │
│    │                       └──→ await api.reportIncident()           │
│    └─→ if result          incidents          │         │              │
│          show success      │                  │         ├─ Content-  │
│          else error        │                  │         │  Type:     │
│                            │                  │         │  JSON      │
│                            └──────────────────┘         │              │
│                                                         └─ {...}     │
│                                                         Body          │
│                                                                        │
└──────────────────────────────────────────────────────────────────────────┘

PARALLEL FLOW FOR SHARE LOCATION:

<ShareButton>
│
└─ handleShareLocation()
   └─ await shareLocation()
      └─ await api.shareLocation()
         └─ fetch(POST /api/share-location)
```

---

## 🧪 Testing Pyramid

```
                    ▲
                   ╱ ╲
                  ╱   ╲  E2E Testing
                 ╱     ╲ (Frontend + Backend)
                ╱───────╲
               ╱         ╲
              ╱           ╲ Integration Testing
             ╱             ╲ (Hooks + Mock API)
            ╱───────────────╲
           ╱                 ╲
          ╱                   ╲ Unit Testing
         ╱                     ╲ (Functions)
        ╱───────────────────────╲
       
Level 1: Unit Tests (API functions)
├─ reportIncident() with mock
├─ shareLocation() with mock
└─ Types validation

Level 2: Integration Tests (Hooks + API)
├─ useReportIncident() with mock API
├─ useShareLocation() with mock API
└─ Error handling

Level 3: E2E Tests (Full app)
├─ User flows with real backend
├─ Modal interactions
└─ API integration
```

---

## 📊 Data Flow Detailed

### Request Flow

```
User Input
   │ {description: "Accident"}
   ▼
Component Validation
   │ ✅ Trip ID exists?
   │ ✅ Location available?
   │ ✅ Description not empty?
   ▼
Hook Call
   │ reportIncident({ trip_id, description, lat, lon, timestamp })
   ▼
API Layer
   ├─ if isDevelopment
   │  ├─ console.log('[MOCK]')
   │  └─ return mockResponse
   └─ else
      ├─ fetch(POST /api/incidents)
      └─ return response.json()
```

### Response Flow

```
Backend Response (or Mock)
   │ { incident_id: "INC_001", status: "created" }
   ▼
Hook Processing
   │ ✅ Set isLoading = false
   │ ✅ Set error = null
   │ ✅ Return result
   ▼
Component Handling
   │ ✅ if result → show success
   │ ✅ Clear form
   │ ✅ Close modal
   ▼
UI Update
   │ "Incident signalé avec succès"
   ▼
User Confirmation
   │ ✅ Window alert
   │ ✅ Form reset
   │ ✅ State cleared
```

---

## 🎯 Key Takeaways (Visual)

```
┌─────────────────────────────────┐
│     BEFORE (Monolithic)         │
├─────────────────────────────────┤
│                                 │
│  Component                      │
│  ├─ State                       │
│  ├─ Logic                       │
│  ├─ Fetch calls        ← BAD    │
│  └─ UI Rendering                │
│                                 │
│  🔴 Hard to test                │
│  🔴 Hard to maintain            │
│  🔴 Not scalable                │
│                                 │
└─────────────────────────────────┘

        AFTER (3-Layer)
┌─────────────────────────────────┐
│    ┌──────────────────────┐     │
│    │  Component          │     │
│    │  ├─ State           │     │
│    │  ├─ UI Logic        │     │
│    │  └─ UI Rendering    │     │
│    └──────────┬───────────┘     │
│               │                 │
│    ┌──────────▼───────────┐     │
│    │  Hooks              │     │
│    │  ├─ State (loading) │     │
│    │  └─ Error handling  │     │
│    └──────────┬───────────┘     │
│               │                 │
│    ┌──────────▼───────────┐     │
│    │  API Service        │     │
│    │  ├─ Fetch logic     │     │
│    │  ├─ Mock/Prod       │     │
│    │  └─ Types           │     │
│    └──────────┬───────────┘     │
│               │                 │
│            Backend              │
│                                 │
│  🟢 Easy to test                │
│  🟢 Easy to maintain            │
│  🟢 Highly scalable             │
│                                 │
└─────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
DEVELOPMENT
├─ isDevelopment = true
├─ fetch() calls mock API
├─ console.log() for debugging
└─ No backend needed

STAGING
├─ isDevelopment = false
├─ VITE_API_URL = staging.api.com
├─ Real backend integration
└─ Full testing

PRODUCTION
├─ isDevelopment = false
├─ VITE_API_URL = api.transportbf.com
├─ Real backend production
├─ Monitoring enabled
└─ Error tracking active
```

---

## ✨ Architecture Summary Icon

```
🏗️ Foundation (API Service)
│  ├─ Functions: reportIncident, shareLocation
│  ├─ Types: IncidentReportParams, LocationShareResponse
│  └─ Toggle: isDevelopment flag

🧩 Middleware (Hooks)
│  ├─ State: isLoading, error
│  ├─ Try/Catch: Automatic error handling
│  └─ Reusable: Multiple components

🎨 UI (Components)
│  ├─ Clean: No fetch calls
│  ├─ Simple: Use hooks only
│  └─ Reactive: Built-in loading states

✅ Result
   ├─ Testable ✓
   ├─ Maintainable ✓
   ├─ Scalable ✓
   └─ Production-Ready ✓
```

---

*Architecture designed for scalability and maintainability*  
*Following industry best practices (React Query pattern)*  
*Ready for production deployment*
