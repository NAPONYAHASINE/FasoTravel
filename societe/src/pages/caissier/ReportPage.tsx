import { useState } from 'react';
import { Send, AlertTriangle, MessageSquare } from "lucide-react@0.487.0";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';
import { getSupportTicketStatusLabel, getSupportTicketPriorityLabel, getSupportCategoryIcon } from '../../utils/labels';
import { getSupportTicketStatusBadgeClass, getSupportTicketPriorityBadgeClass } from '../../utils/styleUtils';
import { formatDateTime } from '../../utils/dateUtils';

export default function ReportPage() {
  const { user } = useAuth();
  const { supportTickets, addSupportTicket } = useFilteredData();
  
  const [formData, setFormData] = useState({
    subject: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'technical' as 'technical' | 'financial' | 'operational' | 'other',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Erreur: utilisateur non connecté');
      return;
    }

    if (!formData.subject.trim()) {
      toast.error('Veuillez entrer un sujet');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Veuillez entrer une description');
      return;
    }

    // ✅ Créer le ticket de support dans le DataContext
    addSupportTicket({
      subject: formData.subject,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      status: 'open',
      createdBy: user.id,
      createdByName: user.name
    });

    toast.success('✅ Votre signalement a été envoyé au manager de gare !');
    setFormData({ 
      subject: '', 
      priority: 'medium', 
      category: 'technical',
      description: '' 
    });
  };

  // ✅ Filtrer les tickets créés par le caissier actuel
  const myTickets = supportTickets.filter(t => t.createdBy === user?.id);

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Signaler un Problème
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Informez votre manager de tout problème rencontré
        </p>
      </div>

      {/* Formulaire */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#dc2626] via-[#f59e0b] to-[#16a34a] rounded-full flex items-center justify-center">
            <AlertTriangle className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Nouveau signalement
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Décrivez le problème rencontré pour obtenir de l'aide
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">🔧 Technique</SelectItem>
                  <SelectItem value="financial">💰 Financier</SelectItem>
                  <SelectItem value="operational">📋 Opérationnel</SelectItem>
                  <SelectItem value="other">💬 Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Résumez le problème en quelques mots..."
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème en détail : quand est-il survenu, quelles sont les conséquences, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-[#dc2626] via-[#f59e0b] to-[#16a34a]">
            <Send size={16} className="mr-2" />
            Envoyer le signalement
          </Button>
        </form>
      </Card>

      {/* Mes signalements précédents */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Mes signalements ({myTickets.length})
        </h2>

        {myTickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">Aucun signalement pour le moment</p>
            <p className="text-sm">Vos signalements apparaîtront ici une fois envoyés</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTickets
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((ticket) => (
                <Card key={ticket.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getSupportCategoryIcon(ticket.category)}</span>
                        <h3 className="font-bold text-gray-900 dark:text-white">{ticket.subject}</h3>
                        <Badge className={getSupportTicketStatusBadgeClass(ticket.status)}>
                          {getSupportTicketStatusLabel(ticket.status)}
                        </Badge>
                        <Badge className={getSupportTicketPriorityBadgeClass(ticket.priority)}>
                          {getSupportTicketPriorityLabel(ticket.priority)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>
                          📅 {formatDateTime(ticket.createdAt)}
                        </span>
                        {ticket.messages && ticket.messages.length > 0 && (
                          <span>💬 {ticket.messages.length} réponse(s)</span>
                        )}
                      </div>

                      {/* Afficher les réponses s'il y en a */}
                      {ticket.messages && ticket.messages.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-blue-500">
                          {ticket.messages.map((msg) => (
                            <div key={msg.id} className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                {msg.userName}
                              </p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">{msg.message}</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {formatDateTime(msg.timestamp)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}