import { 
  Bus, 
  MapPin, 
  AlertCircle,
  Navigation,
  Clock,
  Users,
  TrendingUp,
  Radio
} from 'lucide-react';

export function GlobalMap() {
  // Pour l'instant, aucune donnée de tracking GPS en temps réel
  // Cette fonctionnalité sera intégrée avec Google Maps API

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar Premium */}
      <div className="w-96 bg-white dark:bg-gray-800 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg transition-colors">
        {/* Header Premium avec gradient */}
        <div 
          className="p-6 text-white relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)' 
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                <MapPin className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl tracking-tight">Carte Temps Réel</h2>
                <p className="text-sm opacity-90">Suivi GPS Live</p>
              </div>
            </div>
            
            {/* Live indicator */}
            <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </div>
              <span className="text-sm">Mise à jour en temps réel</span>
            </div>
          </div>
        </div>

        {/* Stats Cards Premium */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Navigation, value: '0', label: 'En Route', color: 'from-green-500 to-emerald-600', iconBg: 'bg-green-100 dark:bg-green-900', iconColor: 'text-green-700 dark:text-green-400' },
              { icon: Clock, value: '0', label: 'Retards', color: 'from-yellow-500 to-amber-600', iconBg: 'bg-yellow-100 dark:bg-yellow-900', iconColor: 'text-yellow-700 dark:text-yellow-400' },
              { icon: AlertCircle, value: '0', label: 'Incidents', color: 'from-red-500 to-red-600', iconBg: 'bg-red-100 dark:bg-red-900', iconColor: 'text-red-700 dark:text-red-400' },
              { icon: Users, value: '0', label: 'Passagers', color: 'from-yellow-500 to-yellow-600', iconBg: 'bg-yellow-100 dark:bg-yellow-900', iconColor: 'text-yellow-700 dark:text-yellow-400' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity ${stat.color}`}></div>
                  
                  <div className="relative">
                    <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    <div className={`text-2xl bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State Premium */}
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 transition-colors">
          <div className="text-center max-w-xs">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 via-yellow-400 to-green-400 rounded-full blur-2xl opacity-20"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Bus className="text-gray-400 dark:text-gray-300" size={40} />
              </div>
            </div>
            <h3 className="text-lg text-gray-900 dark:text-white mb-2">Aucun véhicule actif</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Le tracking GPS en temps réel affichera ici tous les véhicules en circulation
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700">
              <Radio className="h-4 w-4 text-red-700 dark:text-red-400" />
              <span className="text-xs text-red-800 dark:text-red-300">En attente de données GPS</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 transition-all group">
              <span className="text-sm text-gray-900 dark:text-gray-300">Voir tous les véhicules</span>
              <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Area Premium */}
      <div className="flex-1 relative bg-white dark:bg-gray-900 transition-colors">
        {/* Map Placeholder avec design amélioré */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center max-w-3xl">
            {/* Hero Icon */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-yellow-500 to-green-600 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div 
                className="relative w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-2xl"
                style={{ 
                  background: 'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)' 
                }}
              >
                <MapPin className="text-white" size={48} />
              </div>
            </div>
            
            <h3 className="text-3xl text-gray-900 dark:text-white mb-3 tracking-tight">Carte Interactive FasoTravel</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Cette section affichera une carte Google Maps interactive avec le suivi en temps réel de tous les véhicules en circulation à travers le Burkina Faso.
            </p>
            
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl shadow-lg">
              <AlertCircle className="text-yellow-700 dark:text-yellow-400" size={20} />
              <div className="text-left">
                <p className="text-sm text-yellow-900 dark:text-yellow-200">Google Maps API requise</p>
                <p className="text-xs text-red-600 dark:text-red-400">Configuration dans Intégrations → Google Maps</p>
              </div>
            </div>
            
            {/* Features Grid Premium */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 text-left">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Navigation className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-base text-gray-900 dark:text-white mb-3">Fonctionnalités Live</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    <span>Tracking GPS en temps réel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    <span>Estimation du temps d'arrivée (ETA)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    <span>Alertes de retard automatiques</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    <span>Historique des trajets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    <span>Heatmap des zones actives</span>
                  </li>
                </ul>
              </div>
              
              <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 text-left">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Radio className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h4 className="text-base text-gray-900 dark:text-white mb-3">Intégrations Requises</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5">→</span>
                    <span>Google Maps JavaScript API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5">→</span>
                    <span>Dispositifs de tracking GPS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5">→</span>
                    <span>Backend WebSocket pour le temps réel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5">→</span>
                    <span>Base de données Firebase/Supabase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5">→</span>
                    <span>API de géolocalisation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-8 right-8 w-64 h-64 bg-gradient-to-br from-red-200 via-yellow-200 to-green-200 dark:from-red-900 dark:via-yellow-900 dark:to-green-900 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-8 left-8 w-48 h-48 bg-gradient-to-br from-green-200 via-yellow-200 to-red-200 dark:from-green-900 dark:via-yellow-900 dark:to-red-900 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
}

export default GlobalMap;