/**
 * Exemple d'implémentation des routes pour les stories des compagnies
 * Framework: Express.js
 * Base de données: PostgreSQL (adaptable pour MySQL)
 * 
 * Installation requise:
 * npm install express pg jsonwebtoken
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ================================================

/**
 * Middleware pour vérifier le token JWT
 * Extrait user_id du token et l'attache à req.user
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'UNAUTHORIZED',
      message: 'Token d\'authentification manquant' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'FORBIDDEN',
        message: 'Token invalide ou expiré' 
      });
    }
    req.user = user; // { user_id, email, ... }
    next();
  });
}

// ================================================
// ENDPOINT 1: Récupérer les stories d'un opérateur
// GET /operators/:operatorId/stories
// ================================================

/**
 * Récupère toutes les stories actives (non expirées) d'une compagnie
 * avec le statut de vue de l'utilisateur connecté
 */
router.get('/:operatorId/stories', authenticateToken, async (req, res) => {
  const { operatorId } = req.params;
  const userId = req.user.user_id;
  
  try {
    // Requête SQL pour récupérer les stories avec is_viewed
    const query = `
      SELECT 
        os.id,
        os.operator_id,
        os.type,
        os.media_type,
        os.media_url,
        os.gradient,
        os.title,
        os.subtitle,
        os.description,
        os.emoji,
        os.cta_text,
        os.cta_link,
        os.duration_seconds,
        os.created_at,
        os.expires_at,
        CASE 
          WHEN sv.viewed_at IS NOT NULL THEN true 
          ELSE false 
        END as is_viewed
      FROM operator_stories os
      LEFT JOIN story_views sv 
        ON sv.story_id = os.id 
        AND sv.user_id = $1
      WHERE os.operator_id = $2
        AND os.expires_at > NOW()
      ORDER BY os.created_at DESC
    `;
    
    const result = await pool.query(query, [userId, operatorId]);
    
    // Retourner les stories
    res.json(result.rows);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des stories:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Erreur lors de la récupération des stories' 
    });
  }
});

// ================================================
// ENDPOINT 2: Marquer une story comme vue
// POST /operators/:operatorId/stories/:storyId/view
// ================================================

/**
 * Enregistre qu'un utilisateur a vu une story
 * Évite les doublons grâce à ON CONFLICT
 */
router.post('/:operatorId/stories/:storyId/view', authenticateToken, async (req, res) => {
  const { operatorId, storyId } = req.params;
  const userId = req.user.user_id;
  
  try {
    // Vérifier que la story existe et n'est pas expirée
    const checkQuery = `
      SELECT id, expires_at
      FROM operator_stories
      WHERE id = $1 
        AND operator_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [storyId, operatorId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'NOT_FOUND',
        message: 'Story introuvable' 
      });
    }
    
    const story = checkResult.rows[0];
    const now = new Date();
    const expiresAt = new Date(story.expires_at);
    
    if (expiresAt < now) {
      return res.status(410).json({ 
        error: 'STORY_EXPIRED',
        message: 'Cette story n\'est plus disponible' 
      });
    }
    
    // Enregistrer la vue (ON CONFLICT pour éviter les doublons)
    const insertQuery = `
      INSERT INTO story_views (user_id, story_id, viewed_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, story_id) DO NOTHING
    `;
    
    await pool.query(insertQuery, [userId, storyId]);
    
    res.json({ 
      success: true,
      message: 'Story marquée comme vue' 
    });
    
  } catch (error) {
    console.error('Erreur lors du marquage de la story:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Erreur lors du marquage de la story' 
    });
  }
});

// ================================================
// ENDPOINT 3: Récupérer tous les opérateurs avec compteurs
// GET /operators
// ================================================

/**
 * Liste tous les opérateurs avec le nombre de stories actives
 * et si l'utilisateur a des stories non vues
 */
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  
  try {
    const query = `
      SELECT 
        o.id,
        o.name,
        o.logo,
        o.logo_url,
        o.vehicle_image_url,
        o.rating,
        o.total_trips,
        o.description,
        o.amenities,
        o.phone,
        o.email,
        COUNT(DISTINCT os.id) as stories_count,
        CASE 
          WHEN COUNT(DISTINCT os.id) > COUNT(DISTINCT sv.story_id) 
          THEN true 
          ELSE false 
        END as has_unread_stories
      FROM operators o
      LEFT JOIN operator_stories os 
        ON os.operator_id = o.id 
        AND os.expires_at > NOW()
      LEFT JOIN story_views sv 
        ON sv.story_id = os.id 
        AND sv.user_id = $1
      WHERE o.is_active = true
      GROUP BY o.id
      ORDER BY o.name
    `;
    
    const result = await pool.query(query, [userId]);
    
    // Transformer amenities JSON en tableau
    const operators = result.rows.map(op => ({
      ...op,
      operator_id: op.id, // compatibilité frontend: operator_id attendu
      phone_number: op.phone, // compatibilité frontend
      amenities: op.amenities || [],
      stories_count: parseInt(op.stories_count) || 0,
      has_unread_stories: op.has_unread_stories || false
    }));
    
    res.json(operators);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des opérateurs:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Erreur lors de la récupération des opérateurs' 
    });
  }
});

// ================================================
// ENDPOINT BONUS: Statistiques des stories (Admin)
// GET /operators/:operatorId/stories/stats
// ================================================

/**
 * Retourne les statistiques de vues pour les stories d'un opérateur
 * Réservé aux administrateurs
 */
router.get('/:operatorId/stories/stats', authenticateToken, async (req, res) => {
  const { operatorId } = req.params;
  
  // Vérifier que l'utilisateur est admin (à adapter selon votre système)
  if (!req.user.is_admin) {
    return res.status(403).json({ 
      error: 'FORBIDDEN',
      message: 'Accès réservé aux administrateurs' 
    });
  }
  
  try {
    const query = `
      SELECT 
        os.id,
        os.title,
        os.type,
        os.created_at,
        os.expires_at,
        COUNT(sv.user_id) as total_views,
        COUNT(DISTINCT sv.user_id) as unique_views,
        CASE 
          WHEN os.expires_at > NOW() THEN 'ACTIVE'
          ELSE 'EXPIRED'
        END as status
      FROM operator_stories os
      LEFT JOIN story_views sv ON sv.story_id = os.id
      WHERE os.operator_id = $1
      GROUP BY os.id
      ORDER BY os.created_at DESC
    `;
    
    const result = await pool.query(query, [operatorId]);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// ================================================
// ENDPOINT BONUS: Créer une story (Admin)
// POST /operators/:operatorId/stories
// ================================================

/**
 * Permet à un admin de créer une nouvelle story
 */
router.post('/:operatorId/stories', authenticateToken, async (req, res) => {
  const { operatorId } = req.params;
  const {
    type,
    media_type,
    media_url,
    gradient,
    title,
    subtitle,
    description,
    emoji,
    cta_text,
    cta_link,
    duration_seconds,
    expires_at
  } = req.body;
  
  // Vérifier que l'utilisateur est admin
  if (!req.user.is_admin) {
    return res.status(403).json({ 
      error: 'FORBIDDEN',
      message: 'Accès réservé aux administrateurs' 
    });
  }
  
  // Validation
  if (!title || !type || !media_type) {
    return res.status(400).json({ 
      error: 'VALIDATION_ERROR',
      message: 'Champs requis: title, type, media_type' 
    });
  }
  
  try {
    // Générer un ID unique
    const storyId = `${operatorId}_STORY_${Date.now()}`;
    
    const query = `
      INSERT INTO operator_stories (
        id, operator_id, type, media_type, media_url, gradient,
        title, subtitle, description, emoji, cta_text, cta_link,
        duration_seconds, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      storyId,
      operatorId,
      type,
      media_type,
      media_url || null,
      gradient || null,
      title,
      subtitle || null,
      description || null,
      emoji || null,
      cta_text || null,
      cta_link || null,
      duration_seconds || 5,
      expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours par défaut
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      story: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur lors de la création de la story:', error);
    res.status(500).json({ 
      error: 'INTERNAL_ERROR',
      message: 'Erreur lors de la création de la story' 
    });
  }
});

// ================================================
// EXPORTS
// ================================================

module.exports = router;

// ================================================
// UTILISATION DANS app.js
// ================================================

/*
const express = require('express');
const operatorStoriesRoutes = require('./routes/operator-stories-routes');

const app = express();
app.use(express.json());

// Monter les routes
app.use('/api/operators', operatorStoriesRoutes);

// Démarrer le serveur
app.listen(3000, () => {
  console.log('✅ Serveur démarré sur le port 3000');
});
*/

// ================================================
// TESTS AVEC CURL
// ================================================

/*
# 1. Récupérer les stories d'Air Canada
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/operators/AIR_CANADA/stories

# 2. Marquer une story comme vue
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/operators/AIR_CANADA/stories/AC_STORY_1/view

# 3. Récupérer tous les opérateurs avec compteurs
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/operators

# 4. Créer une story (admin)
curl -X POST \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PROMO",
    "media_type": "gradient",
    "gradient": "from-red-600 to-green-600",
    "title": "Nouvelle promo !",
    "subtitle": "50% de réduction",
    "duration_seconds": 5,
    "expires_at": "2025-12-31T23:59:59Z"
  }' \
  http://localhost:3000/api/operators/AIR_CANADA/stories
*/
