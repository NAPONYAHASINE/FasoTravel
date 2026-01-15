/**
 * Utilitaires de gestion des dates pour éviter la duplication
 * Utilisé dans tous les calculs de statistiques du dashboard
 */

/**
 * Retourne la date "aujourd'hui" (heure système réelle)
 */
export const getCurrentDate = (): Date => {
  // ✅ PRODUCTION READY: Utilise l'heure système réelle
  return new Date();
};

/**
 * Retourne le début de la journée actuelle (00:00:00.000)
 */
export const getToday = (): Date => {
  const today = getCurrentDate();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Retourne le début de la journée d'hier (00:00:00.000)
 */
export const getYesterday = (): Date => {
  const yesterday = getCurrentDate();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
};

/**
 * Retourne la fin de la journée d'hier (23:59:59.999)
 */
export const getYesterdayEnd = (): Date => {
  const yesterday = getYesterday();
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);
  return yesterdayEnd;
};

/**
 * Retourne une date X jours dans le passé (début de journée)
 */
export const getDaysAgo = (days: number): Date => {
  const date = getCurrentDate();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Retourne une date X heures dans le futur
 */
export const getHoursLater = (hours: number): Date => {
  const now = getCurrentDate();
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date: Date | string): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = getToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return checkDate >= today && checkDate < tomorrow;
};

/**
 * Vérifie si une date est hier
 */
export const isYesterday = (date: Date | string): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const yesterday = getYesterday();
  const yesterdayEnd = getYesterdayEnd();
  
  return checkDate >= yesterday && checkDate <= yesterdayEnd;
};

/**
 * Retourne le début et la fin d'une période (7 jours, 30 jours, etc.)
 */
export const getDateRange = (days: number): { start: Date; end: Date } => {
  const end = getCurrentDate();
  const start = getDaysAgo(days);
  
  return { start, end };
};

/**
 * Formate une date en format local français
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR', options);
};

/**
 * Formate une heure en format local français
 */
export const formatTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('fr-FR', options || { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formate une date et heure en format local français
 */
export const formatDateTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('fr-FR', options);
};

/**
 * Filtre un tableau par date (aujourd'hui)
 */
export const filterByToday = <T extends { [key: string]: any }>(
  items: T[],
  dateField: keyof T
): T[] => {
  const today = getToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return items.filter(item => {
    const itemDate = new Date(item[dateField] as string);
    return itemDate >= today && itemDate < tomorrow;
  });
};

/**
 * Filtre un tableau par date (hier)
 */
export const filterByYesterday = <T extends { [key: string]: any }>(
  items: T[],
  dateField: keyof T
): T[] => {
  const yesterday = getYesterday();
  const yesterdayEnd = getYesterdayEnd();
  
  return items.filter(item => {
    const itemDate = new Date(item[dateField] as string);
    return itemDate >= yesterday && itemDate <= yesterdayEnd;
  });
};

/**
 * Retourne le label court d'un jour de la semaine
 */
export const getDayShortLabel = (dayIndex: number): string => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[dayIndex] || '';
};

/**
 * Retourne le label complet d'un jour de la semaine
 */
export const getDayLabel = (dayIndex: number): string => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayIndex] || '';
};

/**
 * Formate un mois en format court (Jan, Fév, Mar, etc.)
 */
export const formatMonthShort = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR', { month: 'short' });
};