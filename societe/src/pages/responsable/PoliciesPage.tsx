import { useState } from 'react';
import { Save, Package, Ban, Shield, Clock, AlertCircle } from "lucide-react@0.487.0";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useData } from '../../contexts/DataContext'; // ✅ AJOUTÉ
import { toast } from 'sonner@2.0.3'; // ✅ AJOUTÉ

export default function PoliciesPage() {
  const { policies, updatePolicy } = useData(); // ✅ UTILISE DataContext
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  // ✅ Map icons par catégorie
  const getIconByCategory = (category: string) => {
    switch (category) {
      case 'baggage': return Package;
      case 'cancellation': return Ban;
      case 'boarding': return Clock;
      case 'safety': return Shield;
      default: return AlertCircle;
    }
  };

  const handleEdit = (policyId: string, currentContent: string) => {
    setEditingId(policyId);
    setTempValue(currentContent);
  };

  const handleSave = (policyId: string) => {
    // ✅ UTILISE updatePolicy du DataContext
    updatePolicy(policyId, { content: tempValue });
    setEditingId(null);
    toast.success('Politique mise à jour avec succès !');
  };

  const handleCancel = () => {
    setEditingId(null);
    setTempValue('');
  };

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Politiques de la Société
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configurez les règles et politiques visibles dans l'application mobile
        </p>
      </div>

      {/* Alerte */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
              Visibilité dans l'application mobile
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Ces politiques sont affichées aux voyageurs dans l'application mobile FasoTravel. 
              Assurez-vous qu'elles soient claires et à jour.
            </p>
          </div>
        </div>
      </Card>

      {/* Grille des politiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {policies.map((policy) => {
          const Icon = getIconByCategory(policy.category);
          const isEditing = editingId === policy.id;

          return (
            <Card key={policy.id} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#dc2626] via-[#f59e0b] to-[#16a34a] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {policy.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {policy.description}
                  </p>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Label htmlFor={`policy-${policy.id}`}>Contenu de la politique</Label>
                  <Textarea
                    id={`policy-${policy.id}`}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleSave(policy.id)}
                      className="tf-btn-primary flex-1"
                    >
                      <Save size={16} className="mr-2" />
                      Enregistrer
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                      {policy.content}
                    </pre>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => handleEdit(policy.id, policy.content)}
                    className="w-full"
                  >
                    Modifier cette politique
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Section CGV */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Conditions Générales de Vente (CGV)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Document légal complet accessible depuis l'application mobile
            </p>
            <Button 
              variant="outline"
              onClick={() => alert('⚖️ Fonctionnalité à venir : Édition des CGV complètes. Contactez le support pour personnaliser vos conditions générales de vente.')}
            >
              Gérer les CGV complètes
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats d'affichage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vues des politiques (7j)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">2,458</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Politique la plus vue</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Bagages</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dernière mise à jour</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Aujourd'hui</p>
        </Card>
      </div>
    </div>
  );
}