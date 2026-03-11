# 🎯 GUIDE D'IMPLÉMENTATION RAPIDE - CORRECTIONS FASOTRAVEL

## ✅ DÉJÀ FAIT
1. ✅ `CreateCompanyModal.tsx` - Modal création société
2. ✅ `ConfirmDialog.tsx` - Dialog confirmation
3. ✅ `exportUtils.ts` - Utils export CSV/JSON
4. ✅ Audit complet documenté

## 🚀 À FAIRE PAR FICHIER

### TransportCompanyManagement.tsx
```typescript
// IMPORTS À AJOUTER :
import { CreateCompanyModal } from '../modals/CreateCompanyModal';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { exportToCSV } from '../../lib/exportUtils';

// DÉJÀ LÀ (lines 41-51) :
const [showCreateModal, setShowCreateModal] = useState(false);
const [showDetailsModal, setShowDetailsModal] = useState(false);
const [selectedCompany, setSelectedCompany] = useState<any>(null);

// FONCTIONS À AJOUTER :
const handleCreateCompany = (data: any) => {
  console.log('Création société:', data);
  // TODO: Intégrer avec backend
  setShowCreateModal(false);
};

// BOUTON LINE 76 - MODIFIER :
<Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700">

// BOUTON LINE 275 - MODIFIER :
<Button onClick={() => { setSelectedCompany(company); setShowDetailsModal(true); }} variant="outline" className="flex-1">

// AJOUTER AVANT </div> FINAL :
<CreateCompanyModal 
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onSubmit={handleCreateCompany}
/>
```

### IncidentManagement.tsx
```typescript
// FONCTIONS À AJOUTER APRÈS LINE 60 :
const handleMarkInProgress = (incidentId: string) => {
  console.log('Marking incident as in-progress:', incidentId);
  // TODO: Update incident status in context
};

const handleMarkResolved = (incidentId: string) => {
  console.log('Marking incident as resolved:', incidentId);
  // TODO: Update incident status + resolvedAt timestamp
};

// BOUTONS LINES 341-346 - MODIFIER :
<button onClick={() => handleMarkInProgress(selectedIncident.id)} className="...">
  Marquer En Cours
</button>
<button onClick={() => handleMarkResolved(selectedIncident.id)} className="...">
  Marquer Résolu
</button>
```

### SupportCenter.tsx
```typescript
// FONCTIONS DÉJÀ LÀ MAIS TOAST ONLY - AMÉLIORER :
const handleMarkInProgress = () => {
  if (selectedTicket) {
    console.log('Mark in progress:', selectedTicket.id);
    // TODO: Update ticket status
  }
};

const handleMarkResolved = () => {
  if (selectedTicket) {
    console.log('Mark resolved:', selectedTicket.id);
    // TODO: Update ticket status + resolvedAt
  }
};

const handleEscalate = () => {
  if (selectedTicket) {
    console.log('Escalate:', selectedTicket.id);
    // TODO: Escalate ticket to senior support
  }
};
```

### BookingManagement.tsx
```typescript
// LIGNE 187 - AJOUTER IMPORT :
import { exportToCSV } from '../../lib/exportUtils';

// LIGNE 187 - MODIFIER BOUTON :
<button 
  onClick={() => exportToCSV(bookings, 'reservations')}
  className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
>
```

### PaymentManagement.tsx
```typescript
// LIGNE 206 - AJOUTER IMPORT :
import { exportToCSV } from '../../lib/exportUtils';

// LIGNE 206 - MODIFIER BOUTON :
<button 
  onClick={() => exportToCSV(payments, 'paiements')}
  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
>
```

### UserManagement.tsx
```typescript
// LIGNE 217 - REMPLACER FONCTION :
const handleExportUsers = () => {
  exportToCSV(filteredUsers.map(u => ({
    id: u.user_id,
    nom: u.full_name,
    email: u.email,
    role: u.role,
    statut: u.is_active ? 'Actif' : 'Inactif',
    inscrit: new Date(u.created_at).toLocaleDateString()
  })), 'utilisateurs');
};
```

### PassengerManagement.tsx
```typescript
// AJOUTER STATE :
const [confirmDialog, setConfirmDialog] = useState<{show: boolean, action: 'suspend'|'activate', id: string}>({ show: false, action: 'suspend', id: '' });

// LIGNE 285-286 - MODIFIER :
<Button onClick={() => setConfirmDialog({show: true, action: 'suspend', id: passenger.id})} ...>

// LIGNE 295-296 - MODIFIER :
<Button onClick={() => setConfirmDialog({show: true, action: 'activate', id: passenger.id})} ...>

// AJOUTER AVANT </div> FINAL :
<ConfirmDialog
  isOpen={confirmDialog.show}
  onClose={() => setConfirmDialog({...confirmDialog, show: false})}
  onConfirm={() => confirmDialog.action === 'suspend' ? suspendPassenger(confirmDialog.id) : reactivatePassenger(confirmDialog.id)}
  title={confirmDialog.action === 'suspend' ? 'Suspendre le passager' : 'Réactiver le passager'}
  message={`Êtes-vous sûr de vouloir ${confirmDialog.action === 'suspend' ? 'suspendre' : 'réactiver'} ce passager ?`}
  type={confirmDialog.action === 'suspend' ? 'danger' : 'success'}
/>
```

---

## ⚡ QUICK WIN - MODIFICATIONS MINIMALES POUR MAXIMUM D'IMPACT

### 1. TransportCompanyManagement (5 min)
- Connecter bouton "Nouvelle Société"
- Ajouter modal

### 2. Exports CSV (5 min)
- BookingManagement - Ligne 187
- PaymentManagement - Ligne 206  
- UserManagement - Ligne 217

### 3. Actions Incidents/Support (5 min)
- IncidentManagement - Lines 341-346
- SupportCenter - Lines 338-346

### 4. Confirmations (5 min)
- PassengerManagement
- TransportCompanyManagement

**TOTAL: 20 minutes pour 80% de fonctionnalité ! 🚀**
