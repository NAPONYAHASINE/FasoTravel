/**
 * SupportCenter - Gestion des tickets de support
 * 
 * BACKEND-READY ✅
 * - Données: useSupportTickets() → supportService.getAll() → MOCK_SUPPORT_TICKETS
 * - Actions: useSupportActions() → assign / resolve / updateStatus / updatePriority / addReply
 * - Refresh automatique après chaque action
 * - Fil de discussion avec replies visibles
 * - Aucune donnée hardcodée dans le composant
 */

import React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  User, 
  Truck, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Send,
  ArrowLeft,
  ArrowUpCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useSupportTickets, useSupportActions } from '../../hooks/useEntities';
import { useAdminApp } from '../../context/AdminAppContext';
import { getStatusColor, getPriorityColor, getRelativeTime } from '../../lib/utils';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../lib/constants';
import { PAGE_CLASSES } from '../../lib/design-system';
import { toast } from 'sonner@2.0.3';
import type { Support, SupportReply } from '../../shared/types/standardized';

type FilterUserType = 'all' | 'passenger' | 'operator';

export function SupportCenter() {
  // 🔥 HOOKS BACKEND-READY
  const { data: tickets, refresh: refreshTickets } = useSupportTickets();
  const supportActions = useSupportActions();
  const { currentUser } = useAdminApp();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterUserType>('all');
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when ticket changes or replies update
  const selectedTicket = useMemo(() => {
    return selectedTicketId ? tickets.find(t => t.id === selectedTicketId) ?? null : null;
  }, [selectedTicketId, tickets]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.replies?.length]);

  // Stats
  const stats = useMemo(() => {
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in-progress').length;
    const passenger = tickets.filter(t => t.userType === 'passenger').length;
    const operator = tickets.filter(t => t.userType === 'operator').length;
    return { open, inProgress, passenger, operator, total: tickets.length };
  }, [tickets]);

  // Filter + sort
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.userType === filterType);
    }
    return filtered.sort((a, b) => {
      const isActiveA = a.status === 'open' || a.status === 'in-progress';
      const isActiveB = b.status === 'open' || b.status === 'in-progress';
      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;
      const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const pDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tickets, filterType]);

  const openTicketsCount = filteredTickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

  const isTicketClosed = selectedTicket?.status === 'resolved' || selectedTicket?.status === 'closed';

  // ==================== ACTIONS ====================

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedTicket) return;

    setActionLoading('send');
    try {
      const adminId = currentUser?.id || 'admin_001';
      const adminName = currentUser?.name || 'Admin FasoTravel';

      // Ajouter la réponse dans le fil
      const replyResponse = await supportActions.addReply(selectedTicket.id, {
        authorId: adminId,
        authorName: adminName,
        authorRole: 'admin',
        message: message.trim(),
      });

      if (!replyResponse?.success) {
        toast.error('Erreur lors de l\'envoi');
        return;
      }

      // Si le ticket est ouvert, auto-assigner + passer en cours
      if (selectedTicket.status === 'open') {
        await supportActions.assign(selectedTicket.id, adminId);
        await supportActions.updateStatus(selectedTicket.id, 'in-progress');
      }

      setMessage('');
      await refreshTickets();
    } catch {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkInProgress = async () => {
    if (!selectedTicket) return;
    if (selectedTicket.status === 'in-progress') {
      toast.info('Ce ticket est déjà en cours');
      return;
    }

    setActionLoading('in-progress');
    try {
      const adminId = currentUser?.id || 'admin_001';
      await supportActions.assign(selectedTicket.id, adminId);
      const res = await supportActions.updateStatus(selectedTicket.id, 'in-progress');
      if (res?.success) {
        await refreshTickets();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkResolved = async () => {
    if (!selectedTicket || isTicketClosed) return;

    setActionLoading('resolved');
    try {
      const resolution = message.trim() || 'Résolu par l\'administrateur';
      const res = await supportActions.resolve(selectedTicket.id, resolution);
      if (res?.success) {
        // Ajouter le message de résolution dans le fil si du texte a été saisi
        if (message.trim()) {
          const adminId = currentUser?.id || 'admin_001';
          const adminName = currentUser?.name || 'Admin FasoTravel';
          await supportActions.addReply(selectedTicket.id, {
            authorId: adminId,
            authorName: adminName,
            authorRole: 'admin',
            message: `✅ Résolu : ${message.trim()}`,
          });
        }
        setMessage('');
        await refreshTickets();
      } else {
        toast.error('Erreur lors de la résolution');
      }
    } catch {
      toast.error('Erreur lors de la résolution');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;
    if (selectedTicket.priority === 'urgent') {
      toast.info('Déjà en priorité urgente');
      return;
    }

    setActionLoading('escalate');
    try {
      const res = await supportActions.updatePriority(selectedTicket.id, 'urgent');
      if (res?.success) {
        // Ajouter une note système dans le fil
        const adminId = currentUser?.id || 'admin_001';
        const adminName = currentUser?.name || 'Admin FasoTravel';
        await supportActions.addReply(selectedTicket.id, {
          authorId: adminId,
          authorName: adminName,
          authorRole: 'admin',
          message: '⚠️ Ticket escaladé en priorité URGENTE',
        });
        await refreshTickets();
      } else {
        toast.error('Erreur lors de l\'escalade');
      }
    } catch {
      toast.error('Erreur lors de l\'escalade');
    } finally {
      setActionLoading(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="h-full flex bg-white dark:bg-gray-900 transition-colors">
      {/* ===== TICKET LIST ===== */}
      <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all ${
        selectedTicketId ? 'w-96' : 'flex-1'
      }`}>
        {/* Header */}
        <div 
          className="p-6 text-white"
          style={{ background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' }}
        >
          <h2 className="text-xl mb-2">Support Center</h2>
          <p className="text-sm opacity-90">Gestion des tickets clients & opérateurs</p>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {(['all', 'passenger', 'operator'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                  filterType === type
                    ? 'bg-[#dc2626] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'all' && 'Tous'}
                {type === 'passenger' && <><User className="inline mr-1" size={14} />Passagers ({stats.passenger})</>}
                {type === 'operator' && <><Truck className="inline mr-1" size={14} />Opérateurs ({stats.operator})</>}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/40">
              <p className="text-2xl text-[#dc2626]">{stats.open}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ouverts</p>
            </div>
            <div className="text-center p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900/40">
              <p className="text-2xl text-[#f59e0b]">{stats.inProgress}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">En Cours</p>
            </div>
          </div>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredTickets.flatMap((ticket, index) => {
              const items: React.ReactNode[] = [];
              if (openTicketsCount > 0 && index === openTicketsCount) {
                items.push(
                  <div key={`sep-${ticket.id}`} className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-transparent rounded-full" />
                    <span className="text-xs text-red-500 whitespace-nowrap">{openTicketsCount} actif{openTicketsCount > 1 ? 's' : ''}</span>
                    <div className="flex-1 h-0.5 bg-gradient-to-l from-red-500 via-red-400 to-transparent rounded-full" />
                  </div>
                );
              }
              const isActive = ticket.status === 'open' || ticket.status === 'in-progress';
              items.push(
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTicketId === ticket.id
                      ? 'border-[#dc2626] bg-red-100 dark:bg-red-900/20'
                      : isActive
                        ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 hover:border-red-300'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: ticket.userType === 'passenger' ? '#3b82f6' : '#16a34a' }}
                      >
                        {ticket.userType === 'passenger' ? <User size={16} /> : <Truck size={16} />}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">#{ticket.id.slice(-6)}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityBadgeClasses(ticket.priority)}`}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </div>
                  <h4 className="text-sm text-gray-900 dark:text-white mb-1 truncate">{ticket.subject}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {ticket.userType === 'operator' && ticket.companyName ? (
                      <>{ticket.companyName} — {ticket.userName || 'Opérateur'} <span className="text-gray-400 dark:text-gray-500">· {ticket.userId}</span></>
                    ) : (
                      <>{ticket.userName || 'Utilisateur'} <span className="text-gray-400 dark:text-gray-500">· {ticket.userId}</span></>
                    )}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Clock size={12} />{getRelativeTime(ticket.createdAt)}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <MessageSquare size={12} />{(ticket.replies?.length || 0)}
                      </span>
                    </div>
                    <span 
                      className="px-2 py-1 rounded-full"
                      style={{ 
                        backgroundColor: getStatusColor(ticket.status) + '20',
                        color: getStatusColor(ticket.status)
                      }}
                    >
                      {STATUS_LABELS.supportTicket[ticket.status]}
                    </span>
                  </div>
                </div>
              );
              return items;
            })}

            {filteredTickets.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-600 dark:text-gray-400">Aucun ticket</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== TICKET DETAIL ===== */}
      {selectedTicket ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedTicketId(null)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Retour</span>
            </button>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedTicket.userType === 'passenger' ? '#3b82f6' : '#16a34a' }}
                >
                  {selectedTicket.userType === 'passenger' ? <User size={20} /> : <Truck size={20} />}
                </div>
                <div>
                  <h3 className="text-lg text-gray-900 dark:text-white">{selectedTicket.subject}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTicket.userType === 'operator' && selectedTicket.companyName ? (
                      <><span className="text-green-600 dark:text-green-400">{selectedTicket.companyName}</span> — {selectedTicket.userName || 'Opérateur'} <span className="text-gray-400 dark:text-gray-500 text-xs">({selectedTicket.userId})</span></>
                    ) : (
                      <>{selectedTicket.userName || 'Utilisateur'} <span className="text-gray-400 dark:text-gray-500 text-xs">({selectedTicket.userId})</span></>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span 
                  className="px-3 py-1 rounded-full text-sm text-white"
                  style={{ backgroundColor: getPriorityColor(selectedTicket.priority) }}
                >
                  {PRIORITY_LABELS[selectedTicket.priority]}
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-sm text-white"
                  style={{ backgroundColor: getStatusColor(selectedTicket.status) }}
                >
                  {STATUS_LABELS.supportTicket[selectedTicket.status]}
                </span>
              </div>
            </div>
          </div>

          {/* ===== CONVERSATION THREAD ===== */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Message initial du client */}
              <MessageBubble
                authorName={selectedTicket.userName || 'Utilisateur'}
                authorId={selectedTicket.userId}
                role="user"
                message={selectedTicket.message}
                createdAt={selectedTicket.createdAt}
                userType={selectedTicket.userType}
              />

              {/* Replies du fil de discussion */}
              {(selectedTicket.replies || []).map((reply) => (
                <MessageBubble
                  key={reply.id}
                  authorName={reply.authorName}
                  authorId={reply.authorId}
                  role={reply.authorRole}
                  message={reply.message}
                  createdAt={reply.createdAt}
                  userType={selectedTicket.userType}
                />
              ))}

              {/* Banner résolu */}
              {selectedTicket.status === 'resolved' && selectedTicket.resolution && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-900/40">
                  <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
                    <CheckCircle size={16} />
                    <span>Ticket résolu{selectedTicket.resolvedAt ? ` — ${getRelativeTime(selectedTicket.resolvedAt)}` : ''}</span>
                  </div>
                  {selectedTicket.resolution && (
                    <p className="text-sm text-green-700 dark:text-green-400 mt-2 ml-6">{selectedTicket.resolution}</p>
                  )}
                </div>
              )}

              {/* Assigned info */}
              {selectedTicket.assignedToName && selectedTicket.status === 'in-progress' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 border border-yellow-200 dark:border-yellow-900/40">
                  <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                    <AlertCircle size={14} />
                    <span>Assigné à <span className="font-medium">{selectedTicket.assignedToName}</span></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ===== REPLY BAR ===== */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {isTicketClosed ? (
              <div className="text-center py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                Ce ticket est {selectedTicket.status === 'resolved' ? 'résolu' : 'fermé'}
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tapez votre réponse... (Entrée pour envoyer, Shift+Entrée pour sauter une ligne)"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    rows={2}
                  />
                  <button 
                    className="px-5 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 self-end"
                    style={{ background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' }}
                    onClick={handleSendMessage}
                    disabled={!!actionLoading || !message.trim()}
                  >
                    {actionLoading === 'send' ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  <ActionButton
                    label="Marquer En Cours"
                    color="yellow"
                    onClick={handleMarkInProgress}
                    loading={actionLoading === 'in-progress'}
                    disabled={!!actionLoading || selectedTicket.status === 'in-progress'}
                  />
                  <ActionButton
                    label="Marquer Résolu"
                    color="green"
                    icon={<CheckCircle size={14} />}
                    onClick={handleMarkResolved}
                    loading={actionLoading === 'resolved'}
                    disabled={!!actionLoading}
                  />
                  <ActionButton
                    label="Escalader"
                    color="red"
                    icon={<ArrowUpCircle size={14} />}
                    onClick={handleEscalate}
                    loading={actionLoading === 'escalate'}
                    disabled={!!actionLoading || selectedTicket.priority === 'urgent'}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)' }}
            >
              <MessageSquare className="text-white" size={40} />
            </div>
            <h3 className="text-xl text-gray-900 dark:text-white mb-2">Sélectionnez un Ticket</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choisissez un ticket dans la liste pour voir les détails et répondre
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function MessageBubble({ authorName, authorId, role, message, createdAt, userType }: {
  authorName: string;
  authorId: string;
  role: 'admin' | 'user';
  message: string;
  createdAt: string;
  userType: 'passenger' | 'operator';
}) {
  const isAdmin = role === 'admin';
  
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isAdmin ? 'order-1' : ''}`}>
        <div className={`rounded-2xl p-4 shadow-sm ${
          isAdmin
            ? 'bg-[#dc2626]/10 dark:bg-red-900/20 border border-[#dc2626]/20 dark:border-red-800/30 rounded-br-md'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-md'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${
              isAdmin 
                ? 'bg-[#dc2626]' 
                : userType === 'passenger' ? 'bg-blue-500' : 'bg-green-600'
            }`}>
              {isAdmin ? <ShieldCheck size={12} /> : <User size={12} />}
            </div>
            <span className="text-xs text-gray-900 dark:text-white">{authorName}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">({authorId})</span>
            {isAdmin && <span className="text-xs bg-[#dc2626]/20 text-[#dc2626] px-1.5 py-0.5 rounded">Admin</span>}
            <span className="text-xs text-gray-400 ml-auto">{getRelativeTime(createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{message}</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, color, icon, onClick, loading, disabled }: {
  label: string;
  color: 'yellow' | 'green' | 'red';
  icon?: React.ReactNode;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  const colorMap = {
    yellow: 'bg-[#f59e0b] text-white border-[#d97706] hover:bg-[#d97706]',
    green: 'bg-[#16a34a] text-white border-[#15803d] hover:bg-[#15803d]',
    red: 'bg-[#dc2626] text-white border-[#b91c1c] hover:bg-[#b91c1c]',
  };
  
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm transition-colors border flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${colorMap[color]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

function getPriorityBadgeClasses(priority: string) {
  switch (priority) {
    case 'urgent': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-gray-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

export default SupportCenter;