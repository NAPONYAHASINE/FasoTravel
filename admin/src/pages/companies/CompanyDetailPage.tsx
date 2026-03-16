/**
 * @file CompanyDetailPage.tsx
 * @description Detail page for a single transport company
 * 
 * FEATURES:
 * - Company overview with stats
 * - Tabs: Overview, Contact, Informations légales
 * - Actions: Suspend, Edit (permission-based)
 * 
 * BACKEND-READY:
 * - Utilise useCompanyDetail hook (→ transportCompaniesService)
 * - Design-system FasoTravel (PAGE_CLASSES, StatCard)
 */

import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Ban, AlertCircle, Bus, MapPin, Route, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { StatCard } from '../../components/ui/stat-card';
import { PAGE_CLASSES } from '../../lib/design-system';
import { useCompanyDetail } from '../../hooks/useCompanyDetail';
import { toast } from 'sonner@2.0.3';

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { company, error, approve, suspend } = useCompanyDetail(companyId);

  const handleApprove = async () => {
    const result = await approve();
    if (result.success) {
      toast.success('Société approuvée avec succès');
    } else {
      toast.error(result.error || 'Erreur lors de l\'approbation');
    }
  };

  void handleApprove; // Kept for future "Approve" button integration

  const handleSuspend = async () => {
    const reason = prompt('Raison de la suspension:');
    if (!reason) return;
    
    const result = await suspend(reason);
    if (result.success) {
      toast.success('Société suspendue');
    } else {
      toast.error(result.error || 'Erreur lors de la suspension');
    }
  };

  if (error || !company) {
    return (
      <div className={PAGE_CLASSES.container}>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl mb-2 text-gray-900 dark:text-white">Société introuvable</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => navigate('/companies')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/companies')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            
            <div className={PAGE_CLASSES.headerTexts}>
              <h1 className="text-2xl text-gray-900 dark:text-white">{company.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID: {company.id}</p>
            </div>
          </div>

          <div className={PAGE_CLASSES.headerActions}>
            <Badge className={statusColors[company.status]}>
              {company.status.toUpperCase()}
            </Badge>

            {company.status === 'active' && (
              <Button onClick={handleSuspend} variant="destructive">
                <Ban className="w-4 h-4 mr-2" />
                Suspendre
              </Button>
            )}

            <Button onClick={() => navigate(`/companies/${companyId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards — Design-system StatCard */}
      <div className={PAGE_CLASSES.statsGrid}>
        <StatCard
          title="Véhicules"
          value={company.totalVehicles || 0}
          icon={Bus}
          color="red"
        />
        <StatCard
          title="Routes"
          value={company.totalRoutes || 0}
          icon={Route}
          color="yellow"
        />
        <StatCard
          title="Trajets"
          value={company.totalTrips || 0}
          icon={MapPin}
          color="green"
        />
        <StatCard
          title="Note Moyenne"
          value={company.rating ? `${company.rating}/5` : 'N/A'}
          icon={Star}
          color="blue"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="business">Informations légales</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg mb-4 text-gray-900 dark:text-white">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Nom légal</div>
                <div className="text-gray-900 dark:text-white">{company.legalName || company.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                <div className="text-gray-900 dark:text-white">{company.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Téléphone</div>
                <div className="text-gray-900 dark:text-white">{company.phone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Commission</div>
                <div className="text-gray-900 dark:text-white">{company.commission}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Créé le</div>
                <div className="text-gray-900 dark:text-white">{new Date(company.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
              {company.approvedAt && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Approuvé le</div>
                  <div className="text-gray-900 dark:text-white">{new Date(company.approvedAt).toLocaleDateString('fr-FR')}</div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg mb-4 text-gray-900 dark:text-white">Personne de contact</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Nom</div>
                <div className="text-gray-900 dark:text-white">{company.contactPersonName || 'Non renseigné'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Téléphone</div>
                <div className="text-gray-900 dark:text-white">{company.contactPersonPhone || 'Non renseigné'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                <div className="text-gray-900 dark:text-white">{company.contactPersonEmail || 'Non renseigné'}</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-4">
          <Card className="p-6">
            <h3 className="text-lg mb-4 text-gray-900 dark:text-white">Informations légales</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Numéro d'enregistrement</div>
                <div className="text-gray-900 dark:text-white">{company.registrationNumber || 'Non renseigné'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">ID Fiscal</div>
                <div className="text-gray-900 dark:text-white">{company.taxId || 'Non renseigné'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Adresse</div>
                <div className="text-gray-900 dark:text-white">{company.address || 'Non renseignée'}</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
