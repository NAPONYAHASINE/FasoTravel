import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Edit, History } from "lucide-react";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/dateUtils';
import { useData } from '../../contexts/DataContext';
import type { PricingSegment } from '../../services/types';
import { pricingService } from '../../services/api/pricing.service';

// Default pricing segments seeded when context is empty
const DEFAULT_SEGMENTS: PricingSegment[] = [
  { id: '1', route: 'Ouagadougou - Bobo-Dioulasso', from: 'Ouagadougou', to: 'Bobo-Dioulasso', currentPrice: 5000, previousPrice: 4500, lastUpdate: '2024-12-01', season: 'normal' },
  { id: '2', route: 'Ouagadougou - Koudougou', from: 'Ouagadougou', to: 'Koudougou', currentPrice: 2000, previousPrice: 2000, lastUpdate: '2024-11-15', season: 'normal' },
  { id: '3', route: 'Koudougou - Bobo-Dioulasso', from: 'Koudougou', to: 'Bobo-Dioulasso', currentPrice: 3000, previousPrice: 2500, lastUpdate: '2024-12-01', season: 'normal' },
  { id: '4', route: 'Ouagadougou - Fada N\'Gourma', from: 'Ouagadougou', to: 'Fada N\'Gourma', currentPrice: 3500, previousPrice: 3500, lastUpdate: '2024-10-20', season: 'normal' },
  { id: '5', route: 'Ouagadougou - Ouahigouya', from: 'Ouagadougou', to: 'Ouahigouya', currentPrice: 3000, previousPrice: 2800, lastUpdate: '2024-11-25', season: 'high' },
];

interface PriceHistoryEntry {
  date: string;
  price: number;
  reason: string;
}

export default function PricingPage() {
  const { pricingRules: segments, updatePricingRule, addPricingRule } = useData();

  // Seed default segments if context is empty (first visit)
  useEffect(() => {
    if (segments.length === 0) {
      DEFAULT_SEGMENTS.forEach(seg => addPricingRule(seg as any));
    }
  }, [segments.length, addPricingRule]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<PricingSegment | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);

  const handleShowHistory = async () => {
    try {
      const allHistory = await Promise.all(
        segments.map(s => pricingService.getHistory(s.id))
      );
      const flatHistory = allHistory.flat().sort((a, b) => b.date.localeCompare(a.date));
      setPriceHistory(flatHistory.map(h => ({ date: h.date, price: h.price, reason: h.reason })));
    } catch {
      setPriceHistory([]);
    }
    setIsHistoryDialogOpen(true);
  };

  const handleEditPrice = (segment: PricingSegment) => {
    setEditingSegment(segment);
    setNewPrice(segment.currentPrice.toString());
    setPriceReason('');
    setIsEditDialogOpen(true);
  };

  const handleSavePrice = async () => {
    if (editingSegment && newPrice) {
      try {
        await pricingService.updatePrice(editingSegment.id, {
          currentPrice: parseInt(newPrice),
          reason: priceReason.trim() || undefined,
        });
        // Also update DataContext for immediate UI refresh
        updatePricingRule(editingSegment.id, {
          currentPrice: parseInt(newPrice),
          previousPrice: editingSegment.currentPrice,
          lastUpdate: new Date().toISOString().split('T')[0],
        } as any);
        toast.success('Prix mis à jour avec succès');
      } catch {
        toast.error('Erreur lors de la mise à jour du prix');
      }
      setIsEditDialogOpen(false);
      setEditingSegment(null);
      setNewPrice('');
      setPriceReason('');
    }
  };

  const getPriceChange = (segment: PricingSegment) => {
    if (!segment.previousPrice) return null;
    const change = segment.currentPrice - segment.previousPrice;
    const percentChange = (change / segment.previousPrice) * 100;
    return { change, percentChange };
  };

  const totalRevenue = segments.reduce((acc, s) => acc + s.currentPrice, 0);
  const avgPrice = Math.round(totalRevenue / segments.length);

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Tarification
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez les prix par segment et consultez l'historique
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Prix moyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(avgPrice)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Segments tarifaires</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{segments.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Prix min</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(Math.min(...segments.map(s => s.currentPrice)))}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Prix max</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(Math.max(...segments.map(s => s.currentPrice)))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tableau des tarifs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Tarifs par segment
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShowHistory}
          >
            <History size={16} className="mr-2" />
            Historique
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Trajet
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  De → À
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Prix actuel
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Évolution
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Saison
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Dernière MAJ
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment: any) => {
                const priceChange = getPriceChange(segment);
                
                return (
                  <tr
                    key={segment.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {segment.route}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {segment.from} → {segment.to}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency(segment.currentPrice)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      {priceChange && priceChange.change !== 0 ? (
                        <div className={`flex items-center gap-1 ${
                          priceChange.change > 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          <TrendingUp 
                            size={16} 
                            className={priceChange.change < 0 ? 'rotate-180' : ''}
                          />
                          <span className="text-sm font-medium">
                            {priceChange.change > 0 ? '+' : ''}
                            {priceChange.percentChange.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={
                        segment.season === 'high'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          : segment.season === 'low'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }>
                        {segment.season === 'high' ? 'Haute' : segment.season === 'low' ? 'Basse' : 'Normale'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar size={14} />
                        {formatDate(segment.lastUpdate)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPrice(segment)}
                      >
                        <Edit size={16} className="mr-1" />
                        Modifier
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Modification Prix */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le tarif</DialogTitle>
            <DialogDescription>
              {editingSegment && `${editingSegment.from} → ${editingSegment.to}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPrice">Prix actuel</Label>
              <Input
                id="currentPrice"
                value={editingSegment?.currentPrice.toLocaleString() + ' FCFA'}
                disabled
                className="bg-gray-100 dark:bg-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPrice">Nouveau prix (FCFA) *</Label>
              <Input
                id="newPrice"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="5000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Raison du changement</Label>
              <Input
                id="reason"
                value={priceReason}
                onChange={(e) => setPriceReason(e.target.value)}
                placeholder="Ex: Hausse du carburant"
              />
            </div>

            {newPrice && editingSegment && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Aperçu de la modification
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {editingSegment.currentPrice.toLocaleString()} FCFA → {parseInt(newPrice).toLocaleString()} FCFA
                  {' '}
                  <span className={parseInt(newPrice) > editingSegment.currentPrice ? 'text-red-600' : 'text-green-600'}>
                    ({parseInt(newPrice) > editingSegment.currentPrice ? '+' : ''}
                    {((parseInt(newPrice) - editingSegment.currentPrice) / editingSegment.currentPrice * 100).toFixed(1)}%)
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePrice} className="tf-btn-primary">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Historique */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historique des prix</DialogTitle>
            <DialogDescription>
              Consultez l'évolution des tarifs dans le temps
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {priceHistory.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(entry.price)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(entry.date)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


