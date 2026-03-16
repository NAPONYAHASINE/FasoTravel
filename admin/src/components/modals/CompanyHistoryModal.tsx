import { X, History as HistoryIcon, Clock, User as UserIcon } from 'lucide-react';
import { TransportCompany } from '../../shared/types/standardized';
import { useAdminApp } from '../../context/AdminAppContext';

interface CompanyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: TransportCompany;
}

export function CompanyHistoryModal({ isOpen, onClose, company }: CompanyHistoryModalProps) {
  const { auditLogs } = useAdminApp();

  // Filtrer les logs d'audit pour cette société
  const companyLogs = auditLogs
    .filter(log => 
      log.entityType === 'company' && 
      log.entityId === company.id
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20); // Limiter à 20 entrées

  // 🔍 Debug: Logs pour diagnostiquer le problème
  console.log('📊 CompanyHistoryModal Debug:', {
    companyId: company.id,
    companyName: company.name,
    totalAuditLogs: auditLogs.length,
    companyLogs: companyLogs.length,
    allEntityTypes: [...new Set(auditLogs.map(l => l.entityType))],
    companyEntityIds: auditLogs.filter(l => l.entityType === 'company').map(l => l.entityId),
  });

  const formatDate = (date: string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'create': 'Création',
      'update': 'Modification',
      'delete': 'Suppression',
      'approve': 'Approbation',
      'suspend': 'Suspension',
      'reactivate': 'Réactivation',
      'status_change': 'Changement de statut'
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'create': 'text-green-600 dark:text-green-400',
      'update': 'text-blue-600 dark:text-blue-400',
      'delete': 'text-red-600 dark:text-red-400',
      'approve': 'text-green-600 dark:text-green-400',
      'suspend': 'text-red-600 dark:text-red-400',
      'reactivate': 'text-green-600 dark:text-green-400',
      'status_change': 'text-yellow-600 dark:text-yellow-400'
    };
    return colors[action] || 'text-gray-600 dark:text-gray-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div 
          className="p-6 text-white"
          style={{ background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HistoryIcon size={24} />
              <div>
                <h2 className="text-2xl">Historique des modifications</h2>
                <p className="text-sm text-white/80 mt-1">{company.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Fermer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 🔍 Debug Info - À retirer après vérification */}
          {auditLogs.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <p className="text-blue-800 dark:text-blue-300">
                📊 Debug: {auditLogs.length} log(s) total • {companyLogs.length} pour cette société
              </p>
            </div>
          )}
          
          {companyLogs.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-900 dark:text-white mb-2">
                Aucun historique disponible
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Les modifications futures seront affichées ici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {companyLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                  </div>

                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {Object.entries(log.changes).map(([key, value]) => 
                        `${key}: ${value.oldValue} → ${value.newValue}`
                      ).join(', ')}
                    </p>
                  )}

                  {log.userName && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <UserIcon className="w-3 h-3" />
                      <span>Par: {log.userName}</span>
                    </div>
                  )}

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                        Voir les détails
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}