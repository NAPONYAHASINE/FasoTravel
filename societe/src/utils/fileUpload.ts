/**
 * Utilitaire centralisé pour les uploads de fichiers (images/vidéos)
 * Utilisé dans: StoriesPage, PromotionsPage
 * 
 * Respect des règles:
 * ✅ Centralisé - une seule source
 * ✅ Pas de duplication
 * ✅ Réutilisable
 */

export interface UploadedFile {
  url: string;
  type: 'image' | 'video';
  duration?: number; // Durée en secondes pour les vidéos
}

/**
 * Valide un fichier avant upload
 */
export const validateFile = (
  file: File,
  maxSizeImage = 10 * 1024 * 1024, // 10MB par défaut
  maxSizeVideo = 100 * 1024 * 1024  // 100MB par défaut
): { valid: boolean; error?: string } => {
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const validVideoTypes = ['video/mp4', 'video/webm'];
  const allValidTypes = [...validImageTypes, ...validVideoTypes];

  if (!allValidTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Format non supporté. Utilisez JPG, PNG, WebP pour les images ou MP4, WebM pour les vidéos'
    };
  }

  if (validImageTypes.includes(file.type) && file.size > maxSizeImage) {
    return {
      valid: false,
      error: `Image trop grande (max ${maxSizeImage / 1024 / 1024}MB)`
    };
  }

  if (validVideoTypes.includes(file.type) && file.size > maxSizeVideo) {
    return {
      valid: false,
      error: `Vidéo trop grande (max ${maxSizeVideo / 1024 / 1024}MB)`
    };
  }

  return { valid: true };
};

/**
 * Upload un fichier et retourne l'URL + informations
 * 
 * ⚠️ MOCK: Retourne une URL locale temporaire
 * Backend ready: Remplacer par l'appel API
 */
export const uploadFile = (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';

      const mockUrl = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        const videoDuration = Math.round(video.duration);
        resolve({
          url: mockUrl,
          type: 'video',
          duration: videoDuration
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(mockUrl);
        reject(new Error('Erreur lors de la lecture de la vidéo'));
      };

      video.src = mockUrl;
    } else {
      // Image
      const mockUrl = URL.createObjectURL(file);
      resolve({
        url: mockUrl,
        type: 'image'
      });
    }
  });
};

/**
 * Détecte si un fichier est une image ou vidéo
 */
export const getFileType = (file: File): 'image' | 'video' | null => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return null;
};
