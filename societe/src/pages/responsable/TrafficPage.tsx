import { useState, useMemo } from 'react';
import { Plus, Clock, MapPin, Navigation, CheckCircle2, XCircle, Users, Locate, Circle } from 'lucide-react';
import type { Trip as TripType } from '../../contexts/DataContext';
import { useData } from '../../contexts/DataContext';
import { getCurrentDate } from '../../utils/dateUtils';
import { calculateTripOccupancy } from '../../utils/statsUtils';
import { getTripStatusBadgeInfo } from '../../utils/styleUtils';
import { getTripStatusLabel } from '../../utils/labels';
import { BackButton } from '../../components/ui/back-button';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';

export default function TrafficPage() {
  const { trips, stations, routes, addTrip, updateTrip } = useData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({
    routeId: '',
    busNumber: '',
    departureTime: '',
    totalSeats: 45,
  });

  const upcomingTrips = useMemo(() => {
    const now = getCurrentDate();
    return trips.filter(t => {
      const departureTime = new Date(t.departureTime);
      return t.status === 'scheduled' && departureTime > now;
    }).sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
  }, [trips]);

  const activeTrips = useMemo(() => 
    trips.filter(t => t.status === 'departed' || t.status === 'boarding'),
    [trips]
  );

  const completedTrips = useMemo(() => 
    trips.filter(t => t.status === 'arrived'),
    [trips]
  );

  const cancelledTrips = useMemo(() => 
    trips.filter(t => t.status === 'cancelled'),
    [trips]
  );

  const renderTripCard = (trip: TripType) => {
    const statusInfo = getTripStatusBadgeInfo(trip.status);
    const Icon = statusInfo.icon;
    const occupancyRate = calculateTripOccupancy(trip);

    return (
      <Card
        key={trip.id}
        className="p-4 transition-all hover:border-[#f59e0b]"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {trip.departure} → {trip.arrival}
            </h3>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={statusInfo.color}>
                <Icon size={12} className="mr-1" />
                {getTripStatusLabel(trip.status)}
              </Badge>
              {/* Indicateur de statut automatique */}
              {(trip.status === 'boarding' || trip.status === 'departed') && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                  <Navigation size={10} className="mr-1" />
                  GPS Auto
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bus: {trip.busNumber}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2 ml-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                {new Date(trip.departureTime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {new Date(trip.departureTime).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit'
                })}
              </p>
            </div>
            {(trip.status === 'departed' || trip.status === 'boarding') && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e: any) => {
                  e.stopPropagation();
                  handleViewOnMap(trip);
                }}
                className="text-xs px-2 py-1 h-auto whitespace-nowrap"
              >
                <Locate size={12} className="mr-1" />
                Voir sur carte
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Arrivée: {new Date(trip.arrivalTime).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {trip.totalSeats - trip.availableSeats}/{trip.totalSeats}
            </span>
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600 dark:text-gray-400">Taux de remplissage</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {occupancyRate.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all rounded-full"
              style={{
                width: `${occupancyRate}%`,
                backgroundColor: occupancyRate >= 80 ? '#16a34a' : occupancyRate >= 50 ? '#f59e0b' : '#dc2626'
              }}
            />
          </div>
        </div>

        {/* Message d'information pour les statuts automatiques */}
        {trip.status === 'boarding' && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs text-yellow-800 dark:text-yellow-400">
            <Navigation size={14} className="mt-0.5 flex-shrink-0" />
            <p>L'embarquement est en cours. Le départ sera automatiquement enregistré via GPS.</p>
          </div>
        )}

        {trip.status === 'departed' && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-400">
            <Navigation size={14} className="mt-0.5 flex-shrink-0" />
            <p>Le bus est suivi en temps réel. L'arrivée sera automatiquement enregistrée via géolocalisation.</p>
          </div>
        )}

        {trip.status === 'arrived' && (
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-xs text-green-800 dark:text-green-400">
            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
            <p>Voyage terminé avec succès. Arrivée enregistrée automatiquement le {new Date(trip.arrivalTime).toLocaleString('fr-FR')}.</p>
          </div>
        )}

        {/* Action d'annulation uniquement pour les voyages programmés */}
        {trip.status === 'scheduled' && (
          <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              size="sm"
              variant="outline"
              onClick={(e: any) => {
                e.stopPropagation();
                handleCancelTrip(trip.id);
              }}
              className="flex-1 text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <XCircle size={14} className="mr-1" />
              Annuler le départ
            </Button>
          </div>
        )}

        {/* Message pour les voyages programmés */}
        {trip.status === 'scheduled' && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-400">
            <Clock size={14} className="mt-0.5 flex-shrink-0" />
            <p>L'embarquement démarrera automatiquement à l'heure prévue. Le suivi GPS prendra le relais ensuite.</p>
          </div>
        )}
      </Card>
    );
  };

  const handleAddTrip = () => {
    const route = routes.find(r => r.id === newTrip.routeId);
    if (!route) {
      toast.error('Veuillez sélectionner une route');
      return;
    }

    if (!newTrip.busNumber.trim()) {
      toast.error('Veuillez entrer le numéro du bus');
      return;
    }

    if (!newTrip.departureTime) {
      toast.error('Veuillez sélectionner l\'heure de départ');
      return;
    }

    const departureDate = new Date(newTrip.departureTime);
    const arrivalDate = new Date(departureDate.getTime() + route.duration * 60 * 1000);

    // Find the station for this route
    const gare = stations.find(s => s.city === route.departure) || stations[0];

    addTrip({
      routeId: route.id,
      departure: route.departure,
      arrival: route.arrival,
      departureTime: departureDate.toISOString(),
      arrivalTime: arrivalDate.toISOString(),
      busNumber: newTrip.busNumber,
      availableSeats: newTrip.totalSeats,
      totalSeats: newTrip.totalSeats,
      price: route.basePrice,
      status: 'scheduled',
      gareId: gare.id,
      gareName: gare.name,
      serviceClass: 'standard',
    });

    toast.success('Départ ajouté avec succès');
    setIsAddDialogOpen(false);
    setNewTrip({
      routeId: '',
      busNumber: '',
      departureTime: '',
      totalSeats: 45,
    });
  };

  const handleCancelTrip = (tripId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler ce départ ?')) {
      updateTrip(tripId, { status: 'cancelled' });
      toast.success('Départ annulé');
    }
  };

  const handleViewOnMap = (trip: TripType) => {
    // TODO: Intégrer avec Google Maps pour centrer sur ce trajet
    toast.info(`Trajet ${trip.departure} → ${trip.arrival} - Bus ${trip.busNumber}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Carte & Gestion du Trafic
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualisez et gérez tous les départs en temps réel
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-[#f59e0b] hover:bg-[#d97706]"
        >
          <Plus className="mr-2" size={20} />
          Nouveau départ
        </Button>
      </div>

      {/* MAP - Placeholder for Google Maps */}
      <Card className="p-6 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Carte en temps réel
          </h3>
        </div>
        
        <div className="relative bg-gradient-to-br from-green-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden flex items-center justify-center" style={{ height: '500px' }}>
          <div className="text-center">
            <MapPin className="mx-auto mb-4 text-gray-400 dark:text-gray-500" size={64} />
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Google Maps sera intégré ici
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Emplacement réservé pour la carte Google Maps API
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En route</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {activeTrips.length}
              </p>
            </div>
            <Circle className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Programmés</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {upcomingTrips.length}
              </p>
            </div>
            <Clock className="text-gray-600 dark:text-gray-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Terminés</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {completedTrips.length}
              </p>
            </div>
            <CheckCircle2 className="text-green-600 dark:text-green-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Annulés</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {cancelledTrips.length}
              </p>
            </div>
            <XCircle className="text-red-600 dark:text-red-400" size={32} />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">
            En route ({activeTrips.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Programmés ({upcomingTrips.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Terminés ({completedTrips.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Annulés ({cancelledTrips.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTrips.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <Navigation size={48} className="mx-auto mb-3 opacity-30" />
                <p>Aucun dpart en route</p>
              </div>
            ) : (
              activeTrips.map(renderTripCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTrips.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <Clock size={48} className="mx-auto mb-3 opacity-30" />
                <p>Aucun départ programmé</p>
              </div>
            ) : (
              upcomingTrips.map(renderTripCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTrips.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <CheckCircle2 size={48} className="mx-auto mb-3 opacity-30" />
                <p>Aucun départ terminé</p>
              </div>
            ) : (
              completedTrips.map(renderTripCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cancelledTrips.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <XCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p>Aucun départ annulé</p>
              </div>
            ) : (
              cancelledTrips.map(renderTripCard)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Trip Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau départ</DialogTitle>
            <DialogDescription>Planifiez un nouveau départ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="route">Route *</Label>
              <Select
                value={newTrip.routeId}
                onValueChange={(value: any) => setNewTrip({ ...newTrip, routeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une route" />
                </SelectTrigger>
                <SelectContent>
                  {routes
                    .filter(r => r.status === 'active')
                    .map(route => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.departure} → {route.arrival} ({route.distance} km)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="busNumber">Numéro du bus *</Label>
              <Input
                id="busNumber"
                value={newTrip.busNumber}
                onChange={(e) => setNewTrip({ ...newTrip, busNumber: e.target.value })}
                placeholder="Ex: BF-1234-OG"
              />
            </div>

            <div>
              <Label htmlFor="departureTime">Heure de départ *</Label>
              <Input
                id="departureTime"
                type="datetime-local"
                value={newTrip.departureTime}
                onChange={(e) => setNewTrip({ ...newTrip, departureTime: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="totalSeats">Nombre de places</Label>
              <Input
                id="totalSeats"
                type="number"
                value={newTrip.totalSeats}
                onChange={(e) => setNewTrip({ ...newTrip, totalSeats: parseInt(e.target.value) })}
                min={1}
                max={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleAddTrip}
            >
              Créer le départ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

