import { apiClient } from './apiClient';
import { API_ENDPOINTS, isDevelopment } from '../config';

/**
 * PlatformPolicy — aligned with admin's standardized.ts PlatformPolicy type.
 * Mobile only reads published policies (read-only consumer).
 */
export interface PlatformPolicy {
  id: string;
  type: 'privacy' | 'terms' | 'platform_rule';
  title: string;
  summary?: string;
  content: string;
  status?: 'draft' | 'published' | 'archived';
  version?: string;
  scope?: 'global' | 'company_addon';
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Minimal fallback shown ONLY when API call fails AND no cached data exists.
 * In dev mock mode, richer mock data is returned instead.
 */
const ERROR_FALLBACK: PlatformPolicy[] = [
  {
    id: 'fallback_terms',
    type: 'terms',
    title: "Conditions d'utilisation",
    summary: 'Chargement impossible — contenu temporaire.',
    content: 'Les conditions d\'utilisation sont temporairement indisponibles. Veuillez reessayer plus tard ou contacter le support.',
    status: 'published',
  },
  {
    id: 'fallback_privacy',
    type: 'privacy',
    title: 'Politique de confidentialite',
    summary: 'Chargement impossible — contenu temporaire.',
    content: 'La politique de confidentialite est temporairement indisponible. Veuillez reessayer plus tard ou contacter le support.',
    status: 'published',
  },
];

/**
 * Mock data for development — mirrors admin's MOCK_PLATFORM_POLICIES structure.
 * Content is a placeholder; the real content comes from admin publishing.
 */
const MOCK_POLICIES: PlatformPolicy[] = [
  {
    id: 'plat_001',
    type: 'privacy',
    title: 'Politique de Confidentialite FasoTravel',
    summary: 'Comment FasoTravel collecte, utilise et protege vos donnees personnelles.',
    content:
      '# Politique de Confidentialite FasoTravel\n\n' +
      '**Derniere mise a jour : 1er janvier 2025**\n\n' +
      '## 1. Collecte des donnees\n' +
      'FasoTravel collecte les donnees necessaires lors de votre utilisation :\n' +
      '- Nom complet et numero de telephone (inscription)\n' +
      '- Historique des reservations et voyages\n' +
      '- Informations de paiement (traitees par PayDunya)\n\n' +
      '## 2. Utilisation des donnees\n' +
      'Vos donnees sont utilisees pour traiter vos reservations, vous envoyer des notifications et ameliorer nos services.\n\n' +
      '## 3. Vos droits\n' +
      'Vous pouvez demander l\'acces, la modification ou la suppression de vos donnees en contactant support@fasotravel.bf.',
    version: '2.0',
    status: 'published',
    scope: 'global',
    publishedAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'plat_002',
    type: 'terms',
    title: "Conditions Generales d'Utilisation",
    summary: "Les regles regissant l'utilisation de la plateforme FasoTravel.",
    content:
      "# Conditions Generales d'Utilisation FasoTravel\n\n" +
      '**Derniere mise a jour : 15 janvier 2025**\n\n' +
      '## 1. Objet\n' +
      'Les presentes CGU regissent l\'utilisation de la plateforme FasoTravel, service de reservation de billets de transport au Burkina Faso.\n\n' +
      '## 2. Reservations et paiements\n' +
      '- Les prix affiches sont en FCFA et incluent toutes les taxes\n' +
      '- Des frais de service de 100 FCFA s\'appliquent par billet\n\n' +
      '## 3. Annulations et remboursements\n' +
      'Les politiques d\'annulation varient selon les societes de transport. Le standard minimum FasoTravel garantit un remboursement integral sous 24h.\n\n' +
      '## 4. Litiges\n' +
      'Tout litige sera soumis aux tribunaux competents de Ouagadougou, Burkina Faso.',
    version: '2.1',
    status: 'published',
    scope: 'global',
    publishedAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
];

class PlatformPolicyService {
  private cachedPolicies: PlatformPolicy[] | null = null;

  /**
   * Fetches published platform policies.
   * - Dev mode: returns mock data (same structure admin publishes)
   * - Production: GET /policies/platform?status=published&scope=global
   * - On API failure: returns cached data if available, otherwise minimal fallback
   */
  async getPublishedPolicies(): Promise<PlatformPolicy[]> {
    if (isDevelopment()) {
      this.cachedPolicies = MOCK_POLICIES;
      return MOCK_POLICIES;
    }

    try {
      const response = await apiClient.get<PlatformPolicy[]>(API_ENDPOINTS.policies.platformPublished);
      if (Array.isArray(response) && response.length > 0) {
        this.cachedPolicies = response;
        return response;
      }
      return this.cachedPolicies || ERROR_FALLBACK;
    } catch {
      return this.cachedPolicies || ERROR_FALLBACK;
    }
  }
}

export const platformPolicyService = new PlatformPolicyService();
