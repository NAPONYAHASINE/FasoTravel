/**
 * Routes API - Système de Publicités
 * 
 * ENDPOINTS:
 * - GET  /api/ads/active - Récupère les annonces actives (ciblées)
 * - POST /api/ads/:id/impression - Track une impression
 * - POST /api/ads/:id/click - Track un clic
 * - POST /api/ads/:id/conversion - Track une conversion
 * 
 * ADMIN ENDPOINTS:
 * - GET    /api/admin/ads - Liste toutes les annonces
 * - POST   /api/admin/ads - Créer une annonce
 * - PUT    /api/admin/ads/:id - Modifier une annonce
 * - DELETE /api/admin/ads/:id - Supprimer une annonce
 * - GET    /api/admin/ads/analytics - Statistiques globales
 */

const express = require('express');
const router = express.Router();

// Middleware d'authentification admin (à adapter selon votre système)
const requireAdmin = (req, res, next) => {
  // Vérifier si l'utilisateur est admin
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// =============================================
// ENDPOINTS PUBLICS
// =============================================

/**
 * GET /api/ads/active
 * Récupère les annonces actives selon le ciblage
 * 
 * Query params:
 * - page: string (nom de la page actuelle)
 * - user_id: string (ID de l'utilisateur)
 * - is_new: boolean (si l'utilisateur est nouveau)
 */
router.get('/api/ads/active', async (req, res) => {
  try {
    const { page, user_id, is_new } = req.query;
    const isNewUser = is_new === 'true';
    
    // Utiliser la fonction SQL pour récupérer les annonces ciblées
    const query = `
      SELECT * FROM get_active_ads($1, $2)
    `;
    
    const result = await db.query(query, [page || null, isNewUser]);
    const ads = result.rows;
    
    // Filtrer les annonces déjà vues récemment par cet utilisateur
    let filteredAds = ads;
    
    if (user_id) {
      const recentViews = await db.query(`
        SELECT DISTINCT ad_id 
        FROM ad_impressions 
        WHERE user_id = $1 
          AND timestamp > NOW() - INTERVAL '24 hours'
      `, [user_id]);
      
      const viewedAdIds = recentViews.rows.map(r => r.ad_id);
      filteredAds = ads.filter(ad => !viewedAdIds.includes(ad.id));
    }
    
    res.json(filteredAds);
    
  } catch (error) {
    console.error('Error fetching active ads:', error);
    res.status(500).json({ error: 'Failed to fetch advertisements' });
  }
});

/**
 * POST /api/ads/:id/impression
 * Enregistre une impression (vue) d'annonce
 * 
 * Body:
 * - user_id: string (optionnel)
 * - page: string
 * - device_type: string ('mobile', 'desktop', 'tablet')
 */
router.post('/api/ads/:id/impression', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, page, device_type } = req.body;
    const user_agent = req.headers['user-agent'];
    
    // Incrémenter le compteur d'impressions
    await db.query('SELECT increment_ad_impressions($1)', [id]);
    
    // Enregistrer l'impression pour analytics
    await db.query(`
      INSERT INTO ad_impressions (ad_id, user_id, page, device_type, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, user_id || null, page, device_type, user_agent]);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error tracking impression:', error);
    res.status(500).json({ error: 'Failed to track impression' });
  }
});

/**
 * POST /api/ads/:id/click
 * Enregistre un clic sur une annonce
 * 
 * Body:
 * - user_id: string (optionnel)
 * - page: string
 * - action_type: string ('internal' ou 'external')
 * - device_type: string
 */
router.post('/api/ads/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, page, action_type, device_type } = req.body;
    const user_agent = req.headers['user-agent'];
    
    // Incrémenter le compteur de clics
    await db.query('SELECT increment_ad_clicks($1)', [id]);
    
    // Enregistrer le clic pour analytics
    await db.query(`
      INSERT INTO ad_clicks (ad_id, user_id, page, action_type, device_type, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, user_id || null, page, action_type, device_type, user_agent]);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

/**
 * POST /api/ads/:id/conversion
 * Enregistre une conversion (action réussie suite à une pub)
 * 
 * Body:
 * - user_id: string
 * - conversion_type: string ('booking', 'registration', etc.)
 * - revenue_fcfa: number (optionnel)
 * - booking_id: string (optionnel)
 */
router.post('/api/ads/:id/conversion', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, conversion_type, revenue_fcfa, booking_id } = req.body;
    
    // Enregistrer la conversion
    await db.query(`
      INSERT INTO ad_conversions (ad_id, user_id, conversion_type, revenue_fcfa, booking_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, user_id, conversion_type, revenue_fcfa || null, booking_id || null]);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error tracking conversion:', error);
    res.status(500).json({ error: 'Failed to track conversion' });
  }
});

// =============================================
// ENDPOINTS ADMIN
// =============================================

/**
 * GET /api/admin/ads
 * Liste toutes les annonces avec statistiques
 */
router.get('/api/admin/ads', requireAdmin, async (req, res) => {
  try {
    const { status, priority, page } = req.query;
    
    let query = 'SELECT * FROM ad_analytics';
    const conditions = [];
    const params = [];
    
    if (status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (priority) {
      conditions.push(`priority = $${params.length + 1}`);
      params.push(priority);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY priority DESC, created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ error: 'Failed to fetch advertisements' });
  }
});

/**
 * GET /api/admin/ads/:id
 * Récupère une annonce spécifique avec détails
 */
router.get('/api/admin/ads/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT * FROM ad_analytics WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({ error: 'Failed to fetch advertisement' });
  }
});

/**
 * POST /api/admin/ads
 * Créer une nouvelle annonce
 * 
 * Body: Objet Advertisement complet
 */
router.post('/api/admin/ads', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      media_type,
      media_url,
      gradient,
      emoji,
      cta_text,
      action_type,
      action_url,
      internal_page,
      internal_data,
      target_pages,
      target_new_users,
      priority,
      start_date,
      end_date,
      max_impressions,
      max_clicks
    } = req.body;
    
    const created_by = req.user.id;
    
    // Validation
    if (!title || !description || !media_type || !action_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await db.query(`
      INSERT INTO advertisements (
        title, description, media_type, media_url, gradient, emoji,
        cta_text, action_type, action_url, internal_page, internal_data,
        target_pages, target_new_users, priority,
        start_date, end_date, max_impressions, max_clicks, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      title, description, media_type, media_url, gradient, emoji,
      cta_text, action_type, action_url, internal_page, 
      internal_data ? JSON.stringify(internal_data) : null,
      target_pages, target_new_users || false, priority || 5,
      start_date, end_date, max_impressions, max_clicks, created_by
    ]);
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({ error: 'Failed to create advertisement' });
  }
});

/**
 * PUT /api/admin/ads/:id
 * Modifier une annonce existante
 */
router.put('/api/admin/ads/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Construire la requête dynamiquement
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
    
    const result = await db.query(`
      UPDATE advertisements
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `, [id, ...values]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({ error: 'Failed to update advertisement' });
  }
});

/**
 * DELETE /api/admin/ads/:id
 * Supprimer une annonce (soft delete: is_active = false)
 */
router.delete('/api/admin/ads/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    const result = await db.query(`
      UPDATE advertisements
      SET is_active = false
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    
    res.json({ success: true, message: 'Advertisement deleted' });
    
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ error: 'Failed to delete advertisement' });
  }
});

/**
 * GET /api/admin/ads/analytics/overview
 * Statistiques globales du système de publicités
 */
router.get('/api/admin/ads/analytics/overview', requireAdmin, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_ads,
        COUNT(*) FILTER (WHERE is_active = true) as active_ads,
        SUM(impressions_count) as total_impressions,
        SUM(clicks_count) as total_clicks,
        ROUND(
          CASE 
            WHEN SUM(impressions_count) > 0 
            THEN (SUM(clicks_count)::NUMERIC / SUM(impressions_count)::NUMERIC) * 100
            ELSE 0
          END, 2
        ) as avg_ctr,
        (
          SELECT COUNT(*) FROM ad_conversions
        ) as total_conversions
      FROM advertisements
    `);
    
    const topPerformers = await db.query(`
      SELECT 
        id, title, impressions_count, clicks_count, ctr_percent
      FROM ad_analytics
      WHERE status = 'active'
      ORDER BY ctr_percent DESC
      LIMIT 5
    `);
    
    const recentActivity = await db.query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as impressions
      FROM ad_impressions
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);
    
    res.json({
      overview: stats.rows[0],
      top_performers: topPerformers.rows,
      recent_activity: recentActivity.rows
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/admin/ads/:id/analytics
 * Statistiques détaillées d'une annonce spécifique
 */
router.get('/api/admin/ads/:id/analytics', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const impressionsByDay = await db.query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as impressions,
        COUNT(DISTINCT user_id) as unique_users
      FROM ad_impressions
      WHERE ad_id = $1
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 30
    `, [id]);
    
    const clicksByDay = await db.query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as clicks
      FROM ad_clicks
      WHERE ad_id = $1
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 30
    `, [id]);
    
    const byPage = await db.query(`
      SELECT 
        page,
        COUNT(*) as impressions,
        (
          SELECT COUNT(*) 
          FROM ad_clicks 
          WHERE ad_clicks.ad_id = ad_impressions.ad_id 
            AND ad_clicks.page = ad_impressions.page
        ) as clicks
      FROM ad_impressions
      WHERE ad_id = $1
      GROUP BY page
      ORDER BY impressions DESC
    `, [id]);
    
    res.json({
      impressions_by_day: impressionsByDay.rows,
      clicks_by_day: clicksByDay.rows,
      performance_by_page: byPage.rows
    });
    
  } catch (error) {
    console.error('Error fetching ad analytics:', error);
    res.status(500).json({ error: 'Failed to fetch ad analytics' });
  }
});

module.exports = router;
