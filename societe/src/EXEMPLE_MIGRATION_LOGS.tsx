/**
 * EXEMPLE CONCRET : Migration d'une page avec console.log vers le système de logs
 * 
 * Ce fichier montre côte à côte l'avant/après pour comprendre rapidement
 */

// =====================================
// ❌ AVANT : TicketSalePage.tsx (extrait)
// =====================================

export default function TicketSalePage() {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  const handleSeatSelect = (seatNumber: string) => {
    console.log('Siège cliqué:', seatNumber);
    
    if (occupiedSeats.includes(seatNumber)) {
      console.log('ERREUR: Siège occupé');
      toast.error('Ce siège est déjà occupé');
      return;
    }

    console.log('Ajout du siège');
    setSelectedSeats([...selectedSeats, seatNumber]);
    console.log('Sièges actuels:', selectedSeats);
  };

  const handleConfirmSale = () => {
    console.log('====================');
    console.log('VENTE DÉMARRÉE');
    console.log('Trip ID:', currentTrip?.id);
    console.log('Passagers:', passengers);
    console.log('Prix unitaire:', currentTrip?.price);
    console.log('Paiement:', paymentMethod);
    console.log('====================');

    try {
      passengers.forEach((passenger, index) => {
        console.log(`Création billet ${index + 1}/${passengers.length}`);
        console.log('Données:', passenger);
        
        addTicket({
          tripId: currentTrip.id,
          passengerName: passenger.name,
          passengerPhone: passenger.phone,
          seatNumber: passenger.seatNumber,
          price: currentTrip.price,
          salesChannel: 'counter',
          paymentMethod: paymentMethod,
          // ...
        });
        
        console.log('Billet créé avec succès');
      });

      console.log('====================');
      console.log('VENTE TERMINÉE AVEC SUCCÈS');
      console.log('Nombre de billets:', passengers.length);
      console.log('Montant total:', passengers.length * currentTrip.price);
      console.log('====================');

      toast.success('Vente confirmée');
      navigate('/caissier/historique');

    } catch (error) {
      console.log('ERREUR LORS DE LA VENTE');
      console.log('Détails:', error);
      toast.error('Erreur lors de la vente');
    }
  };

  return (
    <div>
      {/* ... UI ... */}
    </div>
  );
}

// PROBLÈMES :
// ❌ Logs s'affichent en PRODUCTION
// ❌ Pas de contexte (quel composant ?)
// ❌ Difficile à lire (tout en noir/blanc)
// ❌ Pas de filtrage possible
// ❌ Ralentit l'application en production

// =====================================
// ✅ APRÈS : TicketSalePage.tsx (extrait)
// =====================================

import { createLogger } from '../../utils/logger';

// Créer un logger pour cette page
const logger = createLogger('TicketSalePage', 'vente');

export default function TicketSalePage() {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  const handleSeatSelect = (seatNumber: string) => {
    logger.debug('Tentative de sélection de siège', { seatNumber });
    
    if (occupiedSeats.includes(seatNumber)) {
      logger.warn('Siège déjà occupé', { 
        seatNumber, 
        occupiedSeats: occupiedSeats.length 
      });
      toast.error('Ce siège est déjà occupé');
      return;
    }

    const newSelection = [...selectedSeats, seatNumber];
    setSelectedSeats(newSelection);
    logger.info('Siège sélectionné', { 
      seatNumber, 
      totalSelected: newSelection.length 
    });
  };

  const handleConfirmSale = async () => {
    // Mesurer le temps de la vente
    logger.time('Processus de vente complet');
    
    // Log structuré avec toutes les infos importantes
    logger.group('Détails de la vente', {
      tripId: currentTrip?.id,
      route: `${currentTrip?.departure} → ${currentTrip?.arrival}`,
      departureTime: currentTrip?.departureTime,
      passengersCount: passengers.length,
      paymentMethod,
      pricePerSeat: currentTrip?.price,
      totalAmount: passengers.length * (currentTrip?.price || 0),
      salesChannel: 'counter'
    }, 'info');

    try {
      for (let i = 0; i < passengers.length; i++) {
        const passenger = passengers[i];
        
        logger.debug(`Création billet ${i + 1}/${passengers.length}`, {
          name: passenger.name,
          phone: passenger.phone,
          seat: passenger.seatNumber
        });
        
        addTicket({
          tripId: currentTrip.id,
          passengerName: passenger.name,
          passengerPhone: passenger.phone,
          seatNumber: passenger.seatNumber,
          price: currentTrip.price,
          salesChannel: 'counter',
          paymentMethod: paymentMethod,
          // ...
        });
      }

      logger.timeEnd('Processus de vente complet');
      logger.info('✅ Vente confirmée avec succès', {
        ticketsCreated: passengers.length,
        totalRevenue: passengers.length * currentTrip.price,
        remainingSeats: currentTrip.availableSeats - passengers.length
      });

      toast.success('Vente confirmée');
      navigate('/caissier/historique');

    } catch (error) {
      logger.error('❌ Erreur critique lors de la vente', {
        error: error instanceof Error ? error.message : error,
        tripId: currentTrip?.id,
        passengersCount: passengers.length,
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error('Erreur lors de la vente');
    }
  };

  return (
    <div>
      {/* ... UI ... */}
    </div>
  );
}

// AVANTAGES :
// ✅ Logs désactivés automatiquement en PRODUCTION
// ✅ Contexte clair : [vente] [TicketSalePage]
// ✅ Couleurs pour faciliter la lecture
// ✅ Filtrage possible par catégorie
// ✅ Zero impact performance en production
// ✅ Mesure automatique du temps d'exécution
// ✅ Logs structurés faciles à analyser

// =====================================
// 📺 RENDU DANS LA CONSOLE (développement)
// =====================================

/*
Console en développement :

[14:30:15] [DEBUG] [vente] [TicketSalePage] Tentative de sélection de siège
  { seatNumber: "A1" }

[14:30:15] [INFO] [vente] [TicketSalePage] Siège sélectionné
  { seatNumber: "A1", totalSelected: 1 }

[14:30:45] [INFO] [vente] [TicketSalePage] Détails de la vente
  ▼ {
      tripId: "trip_wg9h2k7p3q",
      route: "Ouagadougou → Bobo-Dioulasso",
      departureTime: "2026-01-13T16:00:00.000Z",
      passengersCount: 2,
      paymentMethod: "cash",
      pricePerSeat: 5000,
      totalAmount: 10000,
      salesChannel: "counter"
    }

[14:30:45] [DEBUG] [vente] [TicketSalePage] Création billet 1/2
  { name: "Jean Ouédraogo", phone: "70123456", seat: "A1" }

[14:30:46] [DEBUG] [vente] [TicketSalePage] Création billet 2/2
  { name: "Marie Kaboré", phone: "76987654", seat: "A2" }

[14:30:46] [DEBUG] [vente] [TicketSalePage] Processus de vente complet: 1247.32ms

[14:30:46] [INFO] [vente] [TicketSalePage] ✅ Vente confirmée avec succès
  ▼ {
      ticketsCreated: 2,
      totalRevenue: 10000,
      remainingSeats: 38
    }

COULEURS :
- [DEBUG] en gris
- [INFO] en bleu
- [WARN] en jaune
- [ERROR] en rouge
- [vente] en vert
- [TicketSalePage] en violet
*/

// =====================================
// 📺 RENDU DANS LA CONSOLE (production)
// =====================================

/*
Console en production :

(vide - tous les logs debug/info sont désactivés)

OU si une erreur critique survient :

[ERROR] [vente] ❌ Erreur critique lors de la vente
  { 
    error: "Network timeout",
    tripId: "trip_wg9h2k7p3q",
    passengersCount: 2
  }
*/

// =====================================
// 🔄 AUTRES EXEMPLES DE MIGRATION
// =====================================

// --- AuthContext.tsx ---
const logAuth = createLogger('AuthContext', 'auth');

// Avant
const login = (email, password) => {
  console.log('Login attempt:', email);
  // ...
  console.log('Login successful');
};

// Après
const login = (email, password) => {
  logAuth.info('Tentative de connexion', { email });
  // ...
  logAuth.info('✅ Connexion réussie', { 
    userId: user.id, 
    role: user.role 
  });
};

// --- DataContext.tsx ---
const logData = createLogger('DataContext', 'data');

// Avant
const addTicket = (ticketData) => {
  console.log('Adding ticket:', ticketData);
  // ...
  console.log('Ticket added successfully');
};

// Après
const addTicket = (ticketData) => {
  logData.debug('Ajout ticket', { tripId: ticketData.tripId });
  // ...
  logData.info('✅ Ticket créé', { 
    ticketId: ticket.id,
    salesChannel: ticket.salesChannel 
  });
};

// --- CashManagementPage.tsx ---
const logCaisse = createLogger('CashManagementPage', 'caisse');

// Avant
const handleDeposit = (amount) => {
  console.log('Deposit:', amount);
  // ...
  console.log('New balance:', newBalance);
};

// Après
const handleDeposit = (amount) => {
  logCaisse.info('Dépôt de caisse', { 
    amount: formatCurrency(amount) 
  });
  // ...
  logCaisse.info('✅ Nouveau solde', { 
    balance: formatCurrency(newBalance) 
  });
};

// =====================================
// 📊 STATISTIQUES D'IMPACT
// =====================================

/*
AVANT (console.log partout) :
- 150+ console.log éparpillés
- Logs en production visible par clients
- Console illisible (tout mélangé)
- Impossible de filtrer
- Ralentissement : ~50ms par page

APRÈS (système de logs) :
- 150+ logs contextualisés
- Production : console propre
- Console lisible (couleurs + structure)
- Filtrage par catégorie/niveau
- Ralentissement en prod : 0ms (désactivé)
*/

// =====================================
// 💡 TIPS AVANCÉS
// =====================================

// 1. Logs conditionnels
const logger = createLogger('MyComponent', 'general');

if (process.env.NODE_ENV === 'development') {
  logger.debug('Données sensibles', { password: '***' });
}

// 2. Logs de performance
logger.time('Calcul complexe');
const result = heavyComputation();
logger.timeEnd('Calcul complexe'); // Affiche le temps écoulé

// 3. Logs groupés pour structures complexes
logger.group('État complet du composant', {
  user,
  filters,
  data,
  loading,
  error
}, 'debug');

// 4. Logs tableau pour arrays
logger.table(tickets.map(t => ({
  id: t.id,
  passenger: t.passengerName,
  price: t.price
})), 'debug');

// 5. Filtrage dynamique
import { configureLogger } from '../utils/logger';

// Ne logger QUE les ventes et erreurs
configureLogger({
  allowedCategories: ['vente', 'caisse'],
  enableDebug: false
});
