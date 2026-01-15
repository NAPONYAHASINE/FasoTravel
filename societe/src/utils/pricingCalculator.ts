import { PricingRule } from '../contexts/DataContext';

/**
 * Calcule le prix final d'un trajet en appliquant les règles de tarification
 * @param basePrice Prix de base de la route
 * @param routeId ID de la route
 * @param departureTime Date/heure de départ (ISO string)
 * @param rules Toutes les règles de tarification
 * @returns Prix final arrondi
 */
export function calculatePriceWithRules(
  basePrice: number,
  routeId: string,
  departureTime: string,
  rules: PricingRule[]
): number {
  const departureDate = new Date(departureTime);
  const dayOfWeek = departureDate.getDay(); // 0 = dimanche, 6 = samedi
  const hours = departureDate.getHours();
  const minutes = departureDate.getMinutes();
  const timeOfDay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Filtrer les règles applicables
  const applicableRules = rules
    .filter(r => {
      // 1. Vérifier la route
      if (r.routeId !== routeId) return false;
      
      // 2. Vérifier le statut
      if (r.status !== 'active') return false;
      
      // 3. Vérifier la période
      const startDate = new Date(r.startDate);
      const endDate = r.endDate ? new Date(r.endDate) : null;
      if (departureDate < startDate) return false;
      if (endDate && departureDate > endDate) return false;
      
      // 4. Vérifier les jours de la semaine
      if (r.daysOfWeek && r.daysOfWeek.length > 0) {
        if (!r.daysOfWeek.includes(dayOfWeek)) return false;
      }
      
      // 5. Vérifier les créneaux horaires
      if (r.timeSlots && r.timeSlots.length > 0) {
        const inTimeSlot = r.timeSlots.some(slot => 
          timeOfDay >= slot.start && timeOfDay <= slot.end
        );
        if (!inTimeSlot) return false;
      }
      
      return true;
    })
    .sort((a, b) => a.priority - b.priority); // Trier par priorité
  
  // Appliquer les règles
  let finalPrice = basePrice;
  
  for (const rule of applicableRules) {
    if (rule.type === 'percentage') {
      // Réduction en pourcentage
      finalPrice = finalPrice * (1 - rule.value / 100);
    } else {
      // Réduction fixe
      finalPrice = finalPrice - rule.value;
    }
  }
  
  // S'assurer que le prix reste positif et arrondi
  return Math.max(0, Math.round(finalPrice));
}
