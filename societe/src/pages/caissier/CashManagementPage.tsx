import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, Download, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFilteredData } from '../../hooks/useFilteredData';
import { formatCurrency } from '../../utils/formatters';
import { formatTime, filterByToday, getCurrentDate } from '../../utils/dateUtils';
import { getTransactionTypeLabel } from '../../utils/labels';
import { calculateCashBalance, calculateSalesAmount, calculateRefundsAmount, calculateCashMovements, calculateCashByPaymentMethod } from '../../utils/statsUtils';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { FormDialog } from '../../components/forms/FormDialog';
import { BackButton } from '../../components/ui/back-button';
import { toast } from 'sonner';

export default function CashManagementPage() {
  const { user } = useAuth();
  const { cashTransactions, addCashTransaction } = useFilteredData();
  
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalDescription, setWithdrawalDescription] = useState('');

  // ✅ REFACTORISÉ: Calculate today's transactions
  const todayTransactions = useMemo(() => {
    return filterByToday(cashTransactions, 'timestamp').filter(t => t.status === 'completed');
  }, [cashTransactions]);

  // ✅ REFACTORISÉ: Calculate cash statistics
  const cashStats = useMemo(() => {
    const balance = calculateCashBalance(todayTransactions);
    const sales = calculateSalesAmount(todayTransactions);
    const refunds = calculateRefundsAmount(todayTransactions);
    const { deposits, withdrawals } = calculateCashMovements(todayTransactions);
    
    return {
      balance,
      sales,
      refunds,
      deposits,
      withdrawals
    };
  }, [todayTransactions]);

  // Cash transactions by method
  const cashByMethod = useMemo(() => {
    return calculateCashByPaymentMethod(todayTransactions);
  }, [todayTransactions]);

  const handleDeposit = () => {
    if (!user) return;
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    addCashTransaction({
      type: 'deposit',
      amount: amount,
      method: 'cash',
      description: depositDescription || 'Dépôt de caisse',
      cashierId: user.id,
      cashierName: user.name,
      timestamp: getCurrentDate().toISOString(),
      status: 'completed',
    });

    toast.success(`Dépôt de ${formatCurrency(amount)} enregistré`);
    setIsDepositDialogOpen(false);
    setDepositAmount('');
    setDepositDescription('');
  };

  const handleWithdrawal = () => {
    if (!user) return;
    
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    if (amount > cashStats.balance) {
      toast.error('Montant insuffisant en caisse');
      return;
    }

    addCashTransaction({
      type: 'withdrawal',
      amount: amount,
      method: 'cash',
      description: withdrawalDescription || 'Retrait de caisse',
      cashierId: user.id,
      cashierName: user.name,
      timestamp: getCurrentDate().toISOString(),
      status: 'completed',
    });

    toast.success(`Retrait de ${formatCurrency(amount)} enregistré`);
    setIsWithdrawalDialogOpen(false);
    setWithdrawalAmount('');
    setWithdrawalDescription('');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <TrendingUp className="text-green-600 dark:text-green-400" size={20} />;
      case 'refund':
        return <TrendingDown className="text-red-600 dark:text-red-400" size={20} />;
      case 'deposit':
        return <Download className="text-blue-600 dark:text-blue-400" size={20} />;
      case 'withdrawal':
        return <Upload className="text-orange-600 dark:text-orange-400" size={20} />;
      default:
        return <DollarSign className="text-gray-600 dark:text-gray-400" size={20} />;
    }
  };

  // ✅ SUPPRIMÉ: getTransactionLabel() - utilise getTransactionTypeLabel() de utils/labels.tsx

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestion de Caisse
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Suivez et gérez votre caisse quotidienne
        </p>
      </div>

      {/* Balance Card */}
      <Card className="p-6 bg-gradient-to-br from-[#f59e0b] to-[#d97706]">
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-white/80 mb-1">Solde de caisse</p>
            <h2 className="text-4xl font-bold">
              {formatCurrency(cashStats.balance)}
            </h2>
            <p className="text-sm text-white/60 mt-2">
              {todayTransactions.length} transactions aujourd'hui
            </p>
          </div>
          <ShoppingCart size={64} className="text-white/30" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
          <Button
            onClick={() => setIsDepositDialogOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white border-white/40"
            variant="outline"
          >
            <Download className="mr-2" size={18} />
            Dépôt
          </Button>
          <Button
            onClick={() => setIsWithdrawalDialogOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-white border-white/40"
            variant="outline"
          >
            <Upload className="mr-2" size={18} />
            Retrait
          </Button>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ventes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(cashStats.sales)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remboursements</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(cashStats.refunds)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Download className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dépôts</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(cashStats.deposits)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Upload className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Retraits</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(cashStats.withdrawals)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cash by Method */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Répartition par mode de paiement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Espèces</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(cashByMethod.cash)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mobile Money</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(cashByMethod.mobile_money)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Carte bancaire</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(cashByMethod.card)}
            </p>
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Transactions du jour
        </h3>

        {todayTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <DollarSign size={48} className="mx-auto mb-3 opacity-30" />
            <p>Aucune transaction aujourd'hui</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTransactions.slice().reverse().map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#f59e0b] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getTransactionTypeLabel(transaction.type)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {transaction.description}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    transaction.type === 'sale' || transaction.type === 'deposit'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'sale' || transaction.type === 'deposit' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(transaction.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Deposit Dialog */}
      <FormDialog
        open={isDepositDialogOpen}
        onOpenChange={setIsDepositDialogOpen}
        title="Dépôt de caisse"
        description="Enregistrer un dépôt d'argent en caisse"
        onSubmit={handleDeposit}
        submitLabel="Enregistrer le dépôt"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="deposit-amount">Montant (FCFA) *</Label>
            <Input
              id="deposit-amount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Ex: 50000"
              min={1}
            />
          </div>

          <div>
            <Label htmlFor="deposit-description">Description</Label>
            <Textarea
              id="deposit-description"
              value={depositDescription}
              onChange={(e) => setDepositDescription(e.target.value)}
              placeholder="Ex: Dépôt initial de journée"
              rows={3}
            />
          </div>
        </div>
      </FormDialog>

      {/* Withdrawal Dialog */}
      <FormDialog
        open={isWithdrawalDialogOpen}
        onOpenChange={setIsWithdrawalDialogOpen}
        title="Retrait de caisse"
        description="Enregistrer un retrait d'argent de la caisse"
        onSubmit={handleWithdrawal}
        submitLabel="Enregistrer le retrait"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Solde disponible: <strong>{formatCurrency(cashStats.balance)}</strong>
            </p>
          </div>

          <div>
            <Label htmlFor="withdrawal-amount">Montant (FCFA) *</Label>
            <Input
              id="withdrawal-amount"
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              placeholder="Ex: 10000"
              min={1}
              max={cashStats.balance}
            />
          </div>

          <div>
            <Label htmlFor="withdrawal-description">Description</Label>
            <Textarea
              id="withdrawal-description"
              value={withdrawalDescription}
              onChange={(e) => setWithdrawalDescription(e.target.value)}
              placeholder="Ex: Remise en banque"
              rows={3}
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}


