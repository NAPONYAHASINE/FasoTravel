/**
 * Utilitaires de formatage pour éviter la duplication
 * Centralise tous les formatages de l'application
 */

/**
 * Génère un ID unique
 * @param prefix - Préfixe optionnel (ex: "trip", "ticket")
 * @returns ID unique (ex: "trip_1234567890")
 */
export const generateId = (prefix?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

/**
 * Formate un montant en devise FCFA
 * @param amount - Montant à formater
 * @param showCurrency - Afficher "FCFA" ou non (défaut: true)
 * @returns Montant formaté (ex: "5 000 FCFA")
 */
export const formatCurrency = (amount: number, showCurrency: boolean = true): string => {
  const formatted = amount.toLocaleString('fr-FR');
  return showCurrency ? `${formatted} FCFA` : formatted;
};

/**
 * Formate un pourcentage
 * @param value - Valeur à formater
 * @param decimals - Nombre de décimales (défaut: 0)
 * @returns Pourcentage formaté (ex: "45%")
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calcule et formate un pourcentage à partir de deux valeurs
 * @param value - Valeur
 * @param total - Total
 * @param decimals - Nombre de décimales (défaut: 0)
 * @returns Pourcentage formaté (ex: "45%")
 */
export const calculateAndFormatPercentage = (
  value: number, 
  total: number, 
  decimals: number = 0
): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return formatPercentage(percentage, decimals);
};

/**
 * Calcule un pourcentage (retourne un nombre)
 * @param value - Valeur
 * @param total - Total
 * @returns Pourcentage (ex: 45)
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Formate un numéro de téléphone
 * @param phone - Numéro de téléphone
 * @returns Numéro formaté (ex: "+226 70 12 34 56")
 */
export const formatPhone = (phone: string): string => {
  // Retire tous les espaces
  const cleaned = phone.replace(/\s/g, '');
  
  // Format burkinabé : +226 XX XX XX XX
  if (cleaned.startsWith('+226')) {
    const number = cleaned.slice(4);
    return `+226 ${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4, 6)} ${number.slice(6, 8)}`;
  }
  
  return phone;
};

/**
 * Formate une durée en heures et minutes
 * @param minutes - Durée en minutes
 * @returns Durée formatée (ex: "2h 30min" ou "45min")
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}min`;
  }
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
};

/**
 * Formate une distance en km
 * @param km - Distance en kilomètres
 * @returns Distance formatée (ex: "365 km")
 */
export const formatDistance = (km: number): string => {
  return `${km.toLocaleString('fr-FR')} km`;
};

/**
 * Formate un nombre de sièges
 * @param seats - Nombre de sièges
 * @returns Sièges formatés (ex: "12 places" ou "1 place")
 */
export const formatSeats = (seats: number): string => {
  return seats === 1 ? '1 place' : `${seats} places`;
};

/**
 * Tronque un texte avec ellipse
 * @param text - Texte à tronquer
 * @param maxLength - Longueur maximale
 * @returns Texte tronqué (ex: "Bonjour le mon...")
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formate un nom de route
 * @param departure - Ville de départ
 * @param arrival - Ville d'arrivée
 * @returns Route formatée (ex: "Ouagadougou → Bobo-Dioulasso")
 */
export const formatRoute = (departure: string, arrival: string): string => {
  return `${departure} → ${arrival}`;
};

/**
 * Formate un numéro de siège
 * @param seatNumber - Numéro de siège (ex: "A12")
 * @returns Siège formaté (ex: "Siège A12")
 */
export const formatSeatNumber = (seatNumber: string): string => {
  return `Siège ${seatNumber}`;
};