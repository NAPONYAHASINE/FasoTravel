/**
 * I18N - Internationalization
 * Support: FR (français), EN (english), MO (mooré)
 */

export type Language = 'fr' | 'en' | 'mo';

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
    mo: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.home': { fr: 'Accueil', en: 'Home', mo: 'Yibã' },
  'nav.nearby': { fr: 'À proximité', en: 'Nearby', mo: 'Zĩnd yĩnga' },
  'nav.tickets': { fr: 'Mes billets', en: 'My tickets', mo: 'Mam bãmb' },
  'nav.trips': { fr: 'Trajets', en: 'Trips', mo: 'Tũumsã' },
  'nav.profile': { fr: 'Profil', en: 'Profile', mo: 'Profil' },
  
  // Hero / Home
  'home.title': { fr: 'Réservez votre prochain voyage', en: 'Book your next trip', mo: 'Tũum kẽer yĩnga' },
  'home.search_placeholder': { fr: 'Rechercher un trajet', en: 'Search for a trip', mo: 'Gũusã tũumsã' },
  'home.from': { fr: 'Départ', en: 'From', mo: 'Bõe yĩnga' },
  'home.to': { fr: 'Arrivée', en: 'To', mo: 'Kõng yĩnga' },
  'home.date': { fr: 'Date (optionnelle)', en: 'Date (optional)', mo: 'Zerã (ka sɩd pa)' },
  'home.one_way': { fr: 'Aller simple', en: 'One way', mo: 'Yɛɛg nins' },
  'home.round_trip': { fr: 'Aller-retour', en: 'Round trip', mo: 'Yɛɛgã la wʋsg' },
  'home.search': { fr: 'Rechercher', en: 'Search', mo: 'Gũusã' },
  'home.popular_routes': { fr: 'Trajets populaires', en: 'Popular routes', mo: 'Tũumsã sẽn kõt nins' },
  
  // Nearby
  'nearby.title': { fr: 'À proximité', en: 'Nearby', mo: 'Zĩnd yĩnga' },
  'nearby.subtitle': { fr: 'Gares et véhicules près de vous', en: 'Stations and vehicles near you', mo: 'Tũums ziis la sogã ne fʋʋ' },
  'nearby.current_position': { fr: 'Position actuelle', en: 'Current position', mo: 'Zĩndo nonglmã' },
  'nearby.use_gps': { fr: 'Utiliser ma position GPS', en: 'Use my GPS position', mo: 'Tũum mam GPS' },
  'nearby.stations': { fr: 'Gares à proximité', en: 'Nearby stations', mo: 'Tũums ziis zĩnd yĩnga' },
  'nearby.next_departures': { fr: 'Prochains départs', en: 'Next departures', mo: 'Bõe wakat sẽn kõt' },
  'nearby.no_departures': { fr: 'Aucun départ prévu', en: 'No scheduled departures', mo: 'Bõe wakat bãmb' },
  
  // Tickets
  'tickets.my_tickets': { fr: 'Mes billets', en: 'My tickets', mo: 'Mam bãmb' },
  'tickets.active': { fr: 'Actifs', en: 'Active', mo: 'Sẽn be wakat' },
  'tickets.embarked': { fr: 'Embarqués', en: 'Boarded', mo: 'Sẽn kẽng' },
  'tickets.cancelled': { fr: 'Annulés', en: 'Cancelled', mo: 'Sẽn zãk' },
  'tickets.expired': { fr: 'Expirés', en: 'Expired', mo: 'Sẽn tõe' },
  'tickets.download': { fr: 'Télécharger', en: 'Download', mo: 'Yõod' },
  'tickets.send': { fr: 'Envoyer', en: 'Send', mo: 'Sãam' },
  'tickets.cancel': { fr: 'Annuler', en: 'Cancel', mo: 'Zãk' },
  
  // Trip details
  'trip.duration': { fr: 'Durée', en: 'Duration', mo: 'Wakate' },
  'trip.price': { fr: 'Prix', en: 'Price', mo: 'Sɩngre' },
  'trip.available_seats': { fr: 'places disponibles', en: 'seats available', mo: 'ziisã sẽn be' },
  'trip.select': { fr: 'Sélectionner', en: 'Select', mo: 'Tõe' },
  'trip.book': { fr: 'Réserver', en: 'Book', mo: 'Tũum' },
  
  // Booking
  'booking.passenger_info': { fr: 'Informations passager', en: 'Passenger info', mo: 'Tũumdbã sɩngã' },
  'booking.full_name': { fr: 'Nom complet', en: 'Full name', mo: 'Yʋʋr buud' },
  'booking.phone': { fr: 'Téléphone', en: 'Phone', mo: 'Telefɔn' },
  'booking.select_seat': { fr: 'Choisir un siège', en: 'Select a seat', mo: 'Tõe zĩ' },
  'booking.total': { fr: 'Total', en: 'Total', mo: 'Taremã' },
  'booking.continue': { fr: 'Continuer', en: 'Continue', mo: 'Taar yʋʋr' },
  
  // Status
  'status.available': { fr: 'Disponible', en: 'Available', mo: 'Sẽn be' },
  'status.hold': { fr: 'En attente', en: 'On hold', mo: 'Wakat' },
  'status.paid': { fr: 'Payé', en: 'Paid', mo: 'Sẽn fãa' },
  'status.active': { fr: 'Actif', en: 'Active', mo: 'Sẽn be wakat' },
  'status.cancelled': { fr: 'Annulé', en: 'Cancelled', mo: 'Sẽn zãk' },
  
  // Common
  'common.loading': { fr: 'Chargement...', en: 'Loading...', mo: 'Yõodo...' },
  'common.error': { fr: 'Erreur', en: 'Error', mo: 'Pagba' },
  'common.retry': { fr: 'Réessayer', en: 'Retry', mo: 'Paama yãmb' },
  'common.close': { fr: 'Fermer', en: 'Close', mo: 'Pʋʋs' },
  'common.km': { fr: 'km', en: 'km', mo: 'km' },
};

let currentLanguage: Language = 'fr';

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
};

export const getLanguage = (): Language => {
  return currentLanguage;
};

export const t = (key: string, lang?: Language): string => {
  const language = lang || currentLanguage;
  const translation = translations[key];
  
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  
  return translation[language] || translation.fr || key;
};
