import { useState } from 'react';
import { Star, ThumbsUp, Filter, Search } from "lucide-react@0.487.0";
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { useData } from '../../contexts/DataContext';

export default function ReviewsPage() {
  const { reviews, trips } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // ✅ LOGIQUE: Enrichir les avis avec les données du voyage (departureTime)
  const enrichedReviews = reviews.map(review => {
    const trip = trips.find(t => t.id === review.tripId);
    return {
      ...review,
      departureTime: trip?.departureTime || '', // Date + heure de départ du voyage
      route: `${review.departure} - ${review.arrival}`
    };
  });

  const filteredReviews = enrichedReviews.filter(review => {
    const matchesSearch = 
      review.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRating = filterRating ? review.rating === filterRating : true;
    
    return matchesSearch && matchesRating;
  });

  const averageRating = enrichedReviews.reduce((acc, r) => acc + r.rating, 0) / enrichedReviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: enrichedReviews.filter(r => r.rating === rating).length
  }));

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star
        key={idx}
        size={16}
        className={idx < rating ? 'text-[#f59e0b] fill-current' : 'text-gray-300 dark:text-gray-600'}
      />
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Avis Clients
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Consultez les avis laissés par vos passagers (lecture seule)
        </p>
      </div>

      {/* Stats et note moyenne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Note moyenne */}
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Note moyenne</p>
            <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
              {averageRating.toFixed(1)}
            </p>
            <div className="flex items-center justify-center gap-1 mb-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Basé sur {enrichedReviews.length} avis
            </p>
          </div>
        </Card>

        {/* Distribution des notes */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            Distribution des notes
          </h3>
          <div className="space-y-3">
            {ratingDistribution.map(({ rating, count }) => {
              const percentage = (count / enrichedReviews.length) * 100;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {rating}
                    </span>
                    <Star size={14} className="text-[#f59e0b] fill-current" />
                  </div>
                  <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f59e0b]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={20} />
          <Input
            placeholder="Rechercher un avis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterRating === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterRating(null)}
            className={filterRating === null ? 'tf-btn-primary' : ''}
          >
            Tous
          </Button>
          {[5, 4, 3, 2, 1].map(rating => (
            <Button
              key={rating}
              variant={filterRating === rating ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterRating(rating)}
              className={filterRating === rating ? 'tf-btn-primary' : ''}
            >
              {rating} ⭐
            </Button>
          ))}
        </div>
      </div>

      {/* Liste des avis */}
      <div className="space-y-4">
        {filteredReviews.map(review => (
          <Card key={review.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#dc2626] via-[#f59e0b] to-[#16a34a] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {review.passengerName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {review.passengerName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {review.route}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-13">
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    • Voyage du {new Date(review.departureTime).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(review.date).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {review.comment}
            </p>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                ℹ️ Mode lecture seule - Les réponses aux avis ne sont pas disponibles dans cette version
              </p>
            </div>
          </Card>
        ))}

        {filteredReviews.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Aucun avis trouvé</p>
          </Card>
        )}
      </div>
    </div>
  );
}