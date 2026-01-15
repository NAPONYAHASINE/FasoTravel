import { useMemo, useState } from 'react';
import { Users, DollarSign, ShoppingCart, TrendingUp, Clock, Eye, EyeOff, Pencil, Trash2, Plus, CheckCircle } from "lucide-react@0.487.0";
import { Card } from '../../components/ui/card';
import { BackButton } from '../../components/ui/back-button';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { FormDialog } from '../../components/forms/FormDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useFilteredData } from '../../hooks/useFilteredData';
import { calculateTicketsRevenue, getActiveCashiers, calculateCashBalance, getValidTickets } from '../../utils/statsUtils';
import { filterByToday } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'sonner@2.0.3';

export default function CashiersPage() {
  const { cashiers, tickets, cashTransactions, addCashier, updateCashier, deleteCashier } = useFilteredData();
  
  // États pour les dialogues
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<typeof cashiers[0] | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordInCard, setShowPasswordInCard] = useState<Record<string, boolean>>({});
  
  // État pour le nouveau caissier
  const [newCashier, setNewCashier] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  // ✅ REFACTORISÉ: Filter today's tickets with centralized function
  const todayTickets = useMemo(() => {
    return filterByToday(tickets, 'purchaseDate').filter(
      t => t.status === 'valid' || t.status === 'used'
    );
  }, [tickets]);

  // ✅ REFACTORISÉ: Calculate aggregated stats with centralized functions
  const totalSales = calculateTicketsRevenue(todayTickets);
  const totalTickets = todayTickets.length;

  // Caissiers actifs (ceux qui ont fait au moins une transaction aujourd'hui)
  const activeCashiers = useMemo(() => {
    const todayTransactions = filterByToday(cashTransactions, 'timestamp');
    const activeCashierIds = new Set(todayTransactions.map(t => t.cashierId));
    return cashiers.filter(c => activeCashierIds.has(c.id) && c.status === 'active');
  }, [cashiers, cashTransactions]);

  const getCashierStats = (cashierId: string) => {
    // Tickets du caissier aujourd'hui
    const cashierTickets = todayTickets.filter(t => t.cashierId === cashierId);
    
    // ✅ Utiliser la fonction centralisée pour calculer les revenus
    const sales = calculateTicketsRevenue(cashierTickets);
    const ticketsSold = cashierTickets.length;
    
    // Dernière activité basée sur les tickets
    const lastTicket = cashierTickets.length > 0
      ? cashierTickets.sort((a, b) => 
          new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        )[0]
      : null;
    
    const lastActivity = lastTicket 
      ? new Date(lastTicket.purchaseDate).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : 'Aucune vente';
    
    // Solde de caisse basé sur les transactions
    const cashierTransactions = filterByToday(cashTransactions, 'timestamp').filter(
      t => t.cashierId === cashierId && t.status === 'completed'
    );
    const cashBalance = calculateCashBalance(cashierTransactions);
    
    return {
      sales,
      ticketsSold,
      lastActivity,
      cashBalance
    };
  };

  const handleAddCashier = () => {
    addCashier(newCashier);
    setIsAddDialogOpen(false);
    setNewCashier({
      name: '',
      email: '',
      phone: '',
      password: '',
    });
    toast.success('Caissier ajouté avec succès');
  };

  const handleEditCashier = () => {
    if (editingCashier) {
      updateCashier(editingCashier.id, newCashier);
      setIsEditDialogOpen(false);
      setNewCashier({
        name: '',
        email: '',
        phone: '',
        password: '',
      });
      toast.success('Caissier modifié avec succès');
    }
  };

  const handleDeleteCashier = (cashierId: string) => {
    deleteCashier(cashierId);
    toast.success('Caissier supprimé avec succès');
  };

  const openEditDialog = (cashier: typeof cashiers[0]) => {
    setEditingCashier(cashier);
    setNewCashier({
      name: cashier.name,
      email: cashier.email,
      phone: cashier.phone,
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const togglePasswordVisibility = (cashierId: string) => {
    setShowPasswordInCard(prev => ({
      ...prev,
      [cashierId]: !prev[cashierId]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des Caissiers
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Supervision en temps réel de votre équipe
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="mr-2" size={20} />
          Nouveau caissier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Caissiers actifs</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCashiers.length}/{cashiers.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ventes totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSales.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Billets vendus</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalTickets}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Panier moyen</p>
              <p className="text-2xl font-bold text-[#f59e0b]">
                {totalTickets > 0 ? Math.round(totalSales / totalTickets).toLocaleString() : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <DollarSign className="text-[#f59e0b]" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Liste caissiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cashiers.map(cashier => {
          const { sales, ticketsSold, lastActivity, cashBalance } = getCashierStats(cashier.id);
          return (
            <Card key={cashier.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#dc2626] via-[#f59e0b] to-[#16a34a] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-bold">
                    {cashier.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{cashier.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Dernière activité: {lastActivity}
                      </p>
                    </div>
                    <Badge className={activeCashiers.some(c => c.id === cashier.id)
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }>
                      {activeCashiers.some(c => c.id === cashier.id) ? '🟢 Caisse ouverte' : '⚪ Caisse fermée'}
                    </Badge>
                  </div>

                  {/* Identifiants de connexion */}
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">🔐 Identifiants de connexion</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email:</p>
                        <p className="text-xs font-medium text-gray-900 dark:text-white">{cashier.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Mot de passe:</p>
                        <p className="text-xs font-mono font-medium text-gray-900 dark:text-white">
                          {showPasswordInCard[cashier.id] ? cashier.password : '••••••••'}
                        </p>
                        <button
                          onClick={() => togglePasswordVisibility(cashier.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                          {showPasswordInCard[cashier.id] ? (
                            <EyeOff size={14} className="text-gray-600 dark:text-gray-400" />
                          ) : (
                            <Eye size={14} className="text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ventes du jour</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {sales.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Billets vendus</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {ticketsSold}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => openEditDialog(cashier)}
                      className="bg-[#f59e0b] hover:bg-[#d97706]"
                    >
                      <Pencil className="mr-2" size={20} />
                      Modifier
                    </Button>
                    <Button
                      onClick={() => handleDeleteCashier(cashier.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <Trash2 className="mr-2" size={20} />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Cashier Dialog */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Ajouter un nouveau caissier"
        onSubmit={handleAddCashier}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={newCashier.name}
              onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
              placeholder="Nom complet du caissier"
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={newCashier.email}
              onChange={(e) => setNewCashier({ ...newCashier, email: e.target.value })}
              placeholder="caissier@exemple.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              value={newCashier.phone}
              onChange={(e) => setNewCashier({ ...newCashier, phone: e.target.value })}
              placeholder="+226 70 12 34 56"
            />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe * (min. 6 caractères)</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={newCashier.password}
                onChange={(e) => setNewCashier({ ...newCashier, password: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Edit Cashier Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Modifier le caissier"
        onSubmit={handleEditCashier}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nom *</Label>
            <Input
              id="edit-name"
              value={newCashier.name}
              onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
              placeholder="Nom complet du caissier"
            />
          </div>
          <div>
            <Label htmlFor="edit-email">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              value={newCashier.email}
              onChange={(e) => setNewCashier({ ...newCashier, email: e.target.value })}
              placeholder="caissier@exemple.com"
            />
          </div>
          <div>
            <Label htmlFor="edit-phone">Téléphone *</Label>
            <Input
              id="edit-phone"
              value={newCashier.phone}
              onChange={(e) => setNewCashier({ ...newCashier, phone: e.target.value })}
              placeholder="+226 70 12 34 56"
            />
          </div>
          <div>
            <Label htmlFor="edit-password">Nouveau mot de passe (optionnel, min. 6 caractères)</Label>
            <div className="relative">
              <Input
                id="edit-password"
                type={showPassword ? "text" : "password"}
                value={newCashier.password}
                onChange={(e) => setNewCashier({ ...newCashier, password: e.target.value })}
                placeholder="Laisser vide pour ne pas changer"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}