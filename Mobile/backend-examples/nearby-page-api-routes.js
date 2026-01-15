/**
 * BACKEND API ROUTES - NearbyPage
 * 
 * Ces routes doivent être implémentées dans votre backend
 * pour supporter la fonctionnalité GPS/Tracking de NearbyPage
 * 
 * Backend frameworks suggérés:
 * - Node.js/Express
 * - Python/Django
 * - Java/Spring Boot
 * - Go/Gin
 */

// ============================================
// 1. POST /api/incidents
// ============================================
/**
 * Signalement d'incident par un passager en cours de voyage
 * 
 * Requête (frontend):
 * POST /api/incidents
 * Content-Type: application/json
 * Authorization: Bearer {token}
 * 
 * Body:
 * {
 *   "tripId": "TRIP_12345",           // ID du voyage en cours
 *   "description": "Problème climatisation...",
 *   "timestamp": "2025-11-29T14:30:00Z",
 *   "latitude": 12.3714,
 *   "longitude": -1.5197
 * }
 * 
 * Réponse attendue:
 * {
 *   "success": true,
 *   "incidentId": "INC_98765",
 *   "message": "Incident enregistré avec succès",
 *   "notified": ["operator_id", "support_team"]
 * }
 * 
 * Logique backend:
 * 1. Vérifier l'authentification et les droits
 * 2. Valider le tripId (le voyage existe et l'utilisateur y est embarqué)
 * 3. Créer un enregistrement d'incident avec:
 *    - trip_id
 *    - user_id (du token JWT)
 *    - description
 *    - location (lat/lon)
 *    - timestamp
 *    - status: 'OPEN'
 * 4. Notifier le conducteur et l'équipe support
 * 5. Retourner l'incidentId pour suivi
 */
router.post('/api/incidents', authenticateUser, async (req, res) => {
  try {
    const { tripId, description, timestamp, latitude, longitude } = req.body;
    const userId = req.user.id; // Du token JWT

    // Validation
    if (!tripId || !description?.trim()) {
      return res.status(400).json({ error: 'tripId et description requis' });
    }

    // Vérifier que l'utilisateur est embarqué sur ce voyage
    const ticket = await db.query(
      'SELECT * FROM tickets WHERE trip_id = $1 AND user_id = $2 AND status = $3',
      [tripId, userId, 'EMBARKED']
    );

    if (!ticket.rows.length) {
      return res.status(403).json({ error: 'Vous n\'êtes pas embarqué sur ce voyage' });
    }

    // Créer l'incident
    const incident = await db.query(
      `INSERT INTO incidents (trip_id, user_id, description, latitude, longitude, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [tripId, userId, description, latitude, longitude, 'OPEN']
    );

    // Notifier le conducteur (via WebSocket ou email)
    notifyOperator(tripId, {
      type: 'INCIDENT_REPORTED',
      incidentId: incident.rows[0].id,
      description: description
    });

    res.json({
      success: true,
      incidentId: incident.rows[0].id,
      message: 'Incident enregistré'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ============================================
// 2. POST /api/share-location
// ============================================
/**
 * Partage de position du passager en cours de voyage
 * Activation automatique si proches de la destination (progress >= 70%)
 * 
 * Requête (frontend):
 * POST /api/share-location
 * Content-Type: application/json
 * Authorization: Bearer {token}
 * 
 * Body:
 * {
 *   "tripId": "TRIP_12345",
 *   "latitude": 12.3714,
 *   "longitude": -1.5197,
 *   "timestamp": "2025-11-29T14:30:00Z"
 * }
 * 
 * Réponse attendue:
 * {
 *   "success": true,
 *   "message": "Position partagée avec le conducteur"
 * }
 * 
 * Logique backend:
 * 1. Vérifier que l'utilisateur est embarqué (status = 'EMBARKED')
 * 2. Vérifier que le voyage est proche de la destination (optionnel)
 * 3. Créer un enregistrement de partage de position
 * 4. Notifier le conducteur avec les coordonnées GPS
 * 5. Mettre en cache la position pour 5 minutes
 * 6. Optionnel: Envoyer un SMS/push au conducteur
 */
router.post('/api/share-location', authenticateUser, async (req, res) => {
  try {
    const { tripId, latitude, longitude, timestamp } = req.body;
    const userId = req.user.id;

    // Validation
    if (!tripId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Données de position manquantes' });
    }

    // Vérifier que l'utilisateur est embarqué
    const ticket = await db.query(
      'SELECT * FROM tickets WHERE trip_id = $1 AND user_id = $2 AND status = $3',
      [tripId, userId, 'EMBARKED']
    );

    if (!ticket.rows.length) {
      return res.status(403).json({ error: 'Vous n\'êtes pas embarqué' });
    }

    // Enregistrer le partage de position
    await db.query(
      `INSERT INTO location_shares (trip_id, user_id, latitude, longitude, shared_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [tripId, userId, latitude, longitude]
    );

    // Notifier le conducteur (WebSocket en temps réel)
    notifyOperator(tripId, {
      type: 'PASSENGER_LOCATION',
      userId: userId,
      latitude: latitude,
      longitude: longitude,
      message: 'Un passager à proximité a partagé sa position'
    });

    res.json({ success: true, message: 'Position partagée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ============================================
// 3. GET /api/stations/nearby
// ============================================
/**
 * Récupérer les gares à proximité de l'utilisateur
 * 
 * Requête:
 * GET /api/stations/nearby?lat=12.3714&lon=-1.5197&radius=5
 * 
 * Réponse:
 * {
 *   "stations": [
 *     {
 *       "station": {
 *         "id": "OUAGA_CENTRE",
 *         "name": "Gare Routière Centrale",
 *         "address": "Avenue Kwame Nkrumah",
 *         "city": "Ouagadougou",
 *         "latitude": 12.3714,
 *         "longitude": -1.5197
 *       },
 *       "distance_km": 0.5,
 *       "next_departures": [
 *         {
 *           "trip_id": "TRIP_001",
 *           "departure_time": "2025-11-29T15:00:00Z",
 *           "to_stop_name": "Bobo-Dioulasso",
 *           "operator_name": "STB",
 *           "available_seats": 12
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
router.get('/api/stations/nearby', async (req, res) => {
  try {
    const { lat, lon, radius = 5 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude et longitude requises' });
    }

    // Query stations within radius using PostGIS (si disponible)
    // Sinon, calculer la distance manuelle
    const stations = await db.query(
      `SELECT s.*, 
              ST_Distance(
                ST_GeomFromText('POINT(' || $1 || ' ' || $2 || ')', 4326),
                ST_GeomFromText('POINT(' || s.longitude || ' ' || s.latitude || ')', 4326)
              ) / 1000 as distance_km
       FROM stations s
       WHERE ST_DWithin(
         ST_GeomFromText('POINT(' || $1 || ' ' || $2 || ')', 4326),
         ST_GeomFromText('POINT(' || s.longitude || ' ' || s.latitude || ')', 4326),
         $3 * 1000
       )
       ORDER BY distance_km ASC`,
      [lon, lat, radius]
    );

    // Pour chaque station, récupérer les prochains départs
    const result = await Promise.all(
      stations.rows.map(async (station) => {
        const departures = await db.query(
          `SELECT t.id as trip_id, t.departure_time, t.to_stop_name, t.operator_name
           FROM trips t
           WHERE t.from_station_id = $1 
           AND t.departure_time > NOW()
           ORDER BY t.departure_time ASC
           LIMIT 5`,
          [station.id]
        );

        return {
          station: {
            id: station.id,
            name: station.name,
            address: station.address,
            city: station.city,
            latitude: station.latitude,
            longitude: station.longitude
          },
          distance_km: Math.round(station.distance_km * 10) / 10,
          next_departures: departures.rows
        };
      })
    );

    res.json({ stations: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ============================================
// 4. GET /api/vehicles/tracking/{tripId}
// ============================================
/**
 * Suivi en temps réel du véhicule
 * 
 * Requête:
 * GET /api/vehicles/tracking/TRIP_12345
 * 
 * Réponse:
 * {
 *   "trip_id": "TRIP_12345",
 *   "operator_name": "STB",
 *   "from_stop": "Ouagadougou",
 *   "to_stop": "Bobo-Dioulasso",
 *   "current_latitude": 12.4023,
 *   "current_longitude": -1.4837,
 *   "progress_percent": 45,
 *   "distance_to_user_km": 2.5,
 *   "estimated_arrival": "2025-11-29T16:30:00Z"
 * }
 */
router.get('/api/vehicles/tracking/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;

    const vehicle = await db.query(
      `SELECT 
        t.id as trip_id,
        t.operator_name,
        t.from_stop,
        t.to_stop,
        t.current_latitude,
        t.current_longitude,
        t.progress_percent,
        t.estimated_arrival
       FROM trips t
       WHERE t.id = $1`,
      [tripId]
    );

    if (!vehicle.rows.length) {
      return res.status(404).json({ error: 'Véhicule non trouvé' });
    }

    res.json(vehicle.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ============================================
// WebSocket Events (Optional - Real-time tracking)
// ============================================
/**
 * Pour les mises à jour en temps réel, utiliser WebSocket:
 * 
 * Events à écouter:
 * - 'VEHICLE_LOCATION_UPDATE' : Position du véhicule mise à jour
 * - 'PASSENGER_BOARDING' : Passager embarqué
 * - 'TRIP_STARTED' : Voyage commencé
 * - 'TRIP_ENDED' : Voyage terminé
 * 
 * Frontend:
 * socket.on('VEHICLE_LOCATION_UPDATE', (data) => {
 *   updateVehicleLocation(data);
 * });
 */
