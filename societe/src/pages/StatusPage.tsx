import { CheckCircle2, Clock, Circle, Sun, Moon } from "lucide-react@0.487.0";
import { useTheme } from '../contexts/ThemeContext';
import logoImage from "figma:asset/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png";

export default function StatusPage() {
  const { darkMode, toggleDarkMode } = useTheme();
  
  const modules = [
    {
      role: '👔 RESPONSABLE SOCIÉTÉ',
      status: 'termine',
      features: [
        { name: 'Dashboard principal', status: 'fait', description: 'Vue d\'ensemble + stats' },
        { name: 'Carte & Trafic', status: 'fait', description: 'Suivi GPS + Départs actifs/prochains/anciens + Carte interactive' },
        { name: 'Lignes & Trajets', status: 'fait', description: 'CRUD complet des lignes' },
        { name: 'Horaires Récurrents', status: 'fait', description: 'Horaires fixes TSR-style + génération auto départs' },
        { name: 'Tarification', status: 'fait', description: 'Prix par segment + historique' },
        { name: 'Gestion Gares', status: 'fait', description: 'CRUD gares de la société' },
        { name: 'Gestion Managers', status: 'fait', description: 'CRUD managers' },
        { name: 'Stories', status: 'fait', description: 'Upload + durée custom + ciblage + stats' },
        { name: 'Avis Clients', status: 'fait', description: 'Lecture seule (pas de réponses)' },
        { name: 'Rapports & Analytics', status: 'fait', description: 'Graphiques + Export' },
        { name: 'Politiques Société', status: 'fait', description: 'Configuration politiques bagages/annulation/sécurité' },
        { name: 'Support Admin', status: 'fait', description: 'Contact support + tickets' }
      ]
    },
    {
      role: '🏪 MANAGER DE GARE',
      status: 'termine',
      features: [
        { name: 'Dashboard gare', status: 'fait', description: 'Vue d\'ensemble locale' },
        { name: 'Carte locale', status: 'fait', description: 'Suivi véhicules de la gare avec carte interactive' },
        { name: 'Gestion Caissiers', status: 'fait', description: 'CRUD complet + supervision temps réel' },
        { name: 'Supervision Ventes', status: 'fait', description: 'Lecture seule toutes ventes + répartition par caissier' },
        { name: 'Départs du Jour', status: 'fait', description: 'Liste + Impression listes passagers' },
        { name: 'Gestion Incidents', status: 'fait', description: 'Déclaration + suivi incidents' },
        { name: 'Support Admin', status: 'fait', description: 'Contact support + tickets + FAQ' }
      ]
    },
    {
      role: '💰 CAISSIER',
      status: 'termine',
      features: [
        { name: 'Dashboard caissier', status: 'fait', description: 'Stats personnelles' },
        { name: 'Vente Billets', status: 'fait', description: 'Recherche + Sièges + Paiement (Cash/Mobile/Carte) + Impression' },
        { name: 'Gestion Caisse', status: 'fait', description: 'Ouverture/Fermeture + Suivi rigoureux + Écart réel' },
        { name: 'Listes Passagers', status: 'fait', description: 'Impression listes (pas de contrôle)' },
        { name: 'Annulation Billets', status: 'fait', description: 'Annuler SEULEMENT ses propres ventes' },
        { name: 'Mon Historique', status: 'fait', description: 'Historique ventes personnelles' },
        { name: 'Signalement', status: 'fait', description: 'Signaler un problème' }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fait':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'en_cours':
        return <Clock className="text-yellow-500" size={20} />;
      case 'a_faire':
        return <Circle className="text-gray-500 dark:text-gray-400" size={20} />;
      default:
        return <Circle className="text-gray-500 dark:text-gray-400" size={20} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'fait':
        return { label: 'Terminé', color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' };
      case 'en_cours':
        return { label: 'En cours', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' };
      case 'a_faire':
        return { label: 'À faire', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' };
      default:
        return { label: 'Inconnu', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' };
    }
  };

  const totalFeatures = modules.reduce((acc, module) => acc + module.features.length, 0);
  const completedFeatures = modules.reduce(
    (acc, module) => acc + module.features.filter(f => f.status === 'fait').length,
    0
  );
  const progressPercentage = Math.round((completedFeatures / totalFeatures) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-6 relative">
      {/* Bouton de thème en haut à droite */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 z-50 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
        title={darkMode ? 'Mode clair' : 'Mode sombre'}
      >
        {darkMode ? (
          <Sun size={20} className="text-yellow-500" />
        ) : (
          <Moon size={20} className="text-gray-700" />
        )}
      </button>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <img 
            src={logoImage}
            alt="FasoTravel Logo"
            className="w-20 h-20 mx-auto object-contain mb-6"
          />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            FasoTravel Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Tableau de bord de développement - État des fonctionnalités
          </p>

          {/* Barre de progression globale */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progression globale
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {completedFeatures}/{totalFeatures} ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${progressPercentage}%`,
                  background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="flex items-center justify-center gap-6 mb-12 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-500" size={20} />
            <span className="text-sm text-gray-700 dark:text-gray-300">Terminé</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-yellow-500" size={20} />
            <span className="text-sm text-gray-700 dark:text-gray-300">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="text-gray-500 dark:text-gray-400" size={20} />
            <span className="text-sm text-gray-700 dark:text-gray-300">À faire</span>
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-8">
          {modules.map((module, idx) => {
            const moduleCompleted = module.features.filter(f => f.status === 'fait').length;
            const moduleTotal = module.features.length;
            const moduleProgress = Math.round((moduleCompleted / moduleTotal) * 100);

            return (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                {/* Header du module */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {module.role}
                    </h2>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {moduleCompleted}/{moduleTotal} fonctionnalités
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${moduleProgress}%`,
                        background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)'
                      }}
                    />
                  </div>
                </div>

                {/* Liste des fonctionnalités */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {module.features.map((feature, fidx) => {
                      const statusInfo = getStatusLabel(feature.status);
                      
                      return (
                        <div
                          key={fidx}
                          className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#f59e0b] dark:hover:border-[#f59e0b] transition-colors"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getStatusIcon(feature.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {feature.name}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 max-w-3xl mx-auto">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              📱 Application Mobile FasoTravel
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              L'application mobile est <strong>100% terminée</strong> avec 20 pages, système de réservation,
              paiements Orange/Moov Money, 13 migrations SQL et modèles de données complets.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <a
              href="/login"
              className="px-6 py-3 bg-gradient-to-r from-[#dc2626] via-[#f59e0b] to-[#16a34a] text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              Tester les dashboards →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
