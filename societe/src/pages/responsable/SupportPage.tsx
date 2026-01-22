import { useState } from 'react';
import { Send, HelpCircle, Mail, Phone, MessageCircle, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { getSupportTicketStatusLabel, getSupportTicketPriorityLabel, getSupportCategoryIcon } from '../../utils/labels';
import { getSupportTicketStatusBadgeClass, getSupportTicketPriorityBadgeClass } from '../../utils/styleUtils';
import { formatDateTime } from '../../utils/dateUtils';

export default function SupportPage() {
  const { user } = useAuth();
  const { supportTickets, addSupportTicket, addSupportMessage } = useFilteredData();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'operational' as 'technical' | 'financial' | 'operational' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  // ✅ Responsable voit ses propres tickets de demande d'aide
  const tickets = supportTickets.sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleCreateTicket = () => {
    if (!user || !newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    addSupportTicket({
      subject: newTicket.subject,
      description: newTicket.description,
      category: newTicket.category,
      priority: newTicket.priority,
      status: 'open',
      createdBy: user.id,
      createdByName: user.name
    });

    toast.success('Demande d\'aide envoyée à l\'équipe FasoTravel');
    setIsCreateDialogOpen(false);
    setNewTicket({
      subject: '',
      description: '',
      category: 'operational',
      priority: 'medium'
    });
  };

  const handleReply = (ticketId: string) => {
    if (!user || !replyMessage.trim()) return;

    addSupportMessage(ticketId, replyMessage);

    toast.success('Message envoyé');
    setReplyMessage('');
    setReplyingTo(null);
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Demandes d'Aide
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Contactez l'équipe d'administration FasoTravel pour obtenir de l'aide
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="tf-btn-primary"
        >
          <Plus size={20} className="mr-2" />
          Nouvelle demande
        </Button>
      </div>

      {/* Contacts rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Phone className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Téléphone support</p>
              <p className="font-semibold text-gray-900 dark:text-white">+226 70 12 34 56</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Mail className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email support</p>
              <p className="font-semibold text-gray-900 dark:text-white">support@fasotravel.bf</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <HelpCircle className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Horaires</p>
              <p className="font-semibold text-gray-900 dark:text-white">Lun-Ven: 8h-18h</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tickets.length}
              </p>
            </div>
            <MessageCircle className="text-gray-400" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ouverts</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {tickets.filter((t: any) => t.status === 'open').length}
              </p>
            </div>
            <AlertCircle className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En cours</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {tickets.filter((t: any) => t.status === 'in_progress').length}
              </p>
            </div>
            <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Résolus</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {tickets.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length}
              </p>
            </div>
            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
          </div>
        </Card>
      </div>

      {/* Liste des tickets */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Mes demandes d'aide ({tickets.length})
        </h2>

        {tickets.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Aucune demande d'aide"
            description="Cliquez sur 'Nouvelle demande' pour contacter l'équipe FasoTravel"
          />
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
              <Card key={ticket.id} className="p-4 border-l-4 border-l-purple-500">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getSupportCategoryIcon(ticket.category)}</span>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {ticket.subject}
                        </h3>
                        <Badge className={getSupportTicketStatusBadgeClass(ticket.status)}>
                          <AlertCircle size={14} className="mr-1" />
                          {getSupportTicketStatusLabel(ticket.status)}
                        </Badge>
                        <Badge className={getSupportTicketPriorityBadgeClass(ticket.priority)}>
                          {getSupportTicketPriorityLabel(ticket.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Par {ticket.createdByName} • {formatDateTime(ticket.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 dark:text-gray-300">
                    {ticket.description}
                  </p>

                  {/* Messages - Chat avec l'admin */}
                  {ticket.messages && ticket.messages.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        💬 Discussion avec l'équipe FasoTravel
                      </p>
                      {ticket.messages.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.userId === user?.id
                              ? 'bg-purple-50 dark:bg-purple-900/20 ml-8'
                              : 'bg-green-50 dark:bg-green-900/20 mr-8'
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {msg.userId === user?.id ? 'Vous' : '👨‍💼 Équipe FasoTravel'}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{msg.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDateTime(msg.timestamp)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply form - Répondre à l'admin */}
                  {ticket.status !== 'closed' && (
                    <div className="mt-3">
                      {replyingTo === ticket.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Votre message à l'équipe FasoTravel..."
                            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReply(ticket.id)}
                              disabled={!replyMessage.trim()}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Send size={14} className="mr-2" />
                              Envoyer à l'admin
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyMessage('');
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReplyingTo(ticket.id)}
                        >
                          <MessageCircle size={14} className="mr-2" />
                          Répondre à l'admin
                        </Button>
                      )}
                    </div>
                  )}
                  {ticket.status === 'closed' && (
                    <div className="mt-3">
                      <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        ✓ Ticket fermé par l'équipe FasoTravel
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Dialog pour créer un nouveau ticket */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer un nouveau ticket de support</DialogTitle>
            <DialogDescription>
              Veuillez remplir les informations ci-dessous pour créer un nouveau ticket de support.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Sujet"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              rows={3}
              className="h-24"
            />
            <Select
              value={newTicket.category}
              onValueChange={(value: any) => setNewTicket({ ...newTicket, category: value as 'technical' | 'financial' | 'operational' | 'other' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Catégorie">{newTicket.category}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technique</SelectItem>
                <SelectItem value="financial">Financier</SelectItem>
                <SelectItem value="operational">Opérationnel</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={newTicket.priority}
              onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value as 'low' | 'medium' | 'high' | 'urgent' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Priorité">{newTicket.priority}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleCreateTicket}
            >
              <Plus size={14} className="mr-2" />
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

