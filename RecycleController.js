const pool = require('../config/db');
const logModel = require('../models/LogModel');

/**
 * POST /api/recycle/restore/feeds/:id
 * Restores a feed (and its ingredient links) from softDelete_* back to live tables.
 * - Admins can restore any feed.
 * - Non-admins may only restore feeds they own (clerk_id match).
 * Optional: add ?cleanup=1 to also delete related trash_logs row(s).
 */
async function restoreFeed(req, res) {
  // Auth guard
  const callerClerkId = req.auth?.userId;
  if (!callerClerkId) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }

  // Validate path param
  const feedId = parseInt(req.params.id, 10);
  if (!Number.isInteger(feedId) || feedId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid feed id' });
  }

  const cnn = await pool.getConnection();
  try {
    await cnn.beginTransaction();

    // Determine caller role from DB (users.role)
    const [roleRows] = await cnn.query(
      'SELECT role FROM users WHERE clerk_id = ? LIMIT 1',
      [callerClerkId]
    );
    const callerRole = roleRows[0]?.role ?? 'Guest'; // Admin | Member | Guest

    // Fetch the feed from recycle bin (softDelete_feeds)
    // NOTE: table name is "softDelete_feeds" (capital D) per schema
    const [trashRows] = await cnn.query(
      `SELECT id, name, feed_description, species_id, weight_cat_id, created_at, clerk_id
         FROM softDelete_feeds
        WHERE id = ?`,
      [feedId]
    );
    if (!trashRows.length) {
      await cnn.rollback();
      return res.status(404).json({ success: false, message: 'Feed not found in recycle bin' });
    }
    const row = trashRows[0];

    // Non-admins may only restore their own feed
    if (callerRole !== 'Admin' && row.clerk_id !== callerClerkId) {
      await cnn.rollback();
      return res.status(403).json({ success: false, message: 'Not allowed to restore this feed' });
    }

    // Ensure this id / name doesn’t conflict in the live table
    const [liveExists] = await cnn.query(
      `SELECT id FROM feeds WHERE id = ? OR name = ? LIMIT 1`,
      [row.id, row.name]
    );
    if (liveExists.length) {
      await cnn.rollback();
      return res.status(409).json({
        success: false,
        message: 'Restore conflict: a feed with the same id or name already exists'
      });
    }

    // Insert back into live feeds (preserving original id)
    await cnn.query(
      `INSERT INTO feeds (id, name, feed_description, species_id, weight_cat_id, created_at, clerk_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.name, row.feed_description, row.species_id, row.weight_cat_id, row.created_at, row.clerk_id]
    );

    // Move ingredient associations back (single INSERT...SELECT)
    await cnn.query(
      `INSERT INTO feed_ingredient_association (feed_id, ingredient_id, percentage)
       SELECT feed_id, ingredient_id, percentage
         FROM softDelete_feed_ingredient_association
        WHERE feed_id = ?`,
      [row.id]
    );

    // Clean up recycle bin tables
    await cnn.query(`DELETE FROM softDelete_feed_ingredient_association WHERE feed_id = ?`, [row.id]);
    await cnn.query(`DELETE FROM softDelete_feeds WHERE id = ?`, [row.id]);

    // Optional: remove matching trash_logs (category='feed', deleted_id = id)
    if (req.query.cleanup === '1') {
      await cnn.query(
        `DELETE FROM trash_logs WHERE category = 'feed' AND deleted_id = ?`,
        [row.id]
      );
    }

    await cnn.commit();

    // Log the action
    try {
      await logModel.insertLog(
        callerClerkId,
        'feed',
        `Restored feed: ${row.name} [id=${row.id}]`,
        req.headers['x-forwarded-for'] || req.ip
      );
    } catch (e) {
      console.warn('[Recycle restoreFeed] log insert failed:', e.message);
    }

    return res.status(200).json({ success: true, message: 'Feed restored', data: { id: row.id, name: row.name } });
  } catch (err) {
    await cnn.rollback();
    console.error('[Recycle restoreFeed] tx error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    cnn.release();
  }
}

// BE020 Permanently delete items older than 30 days
async function cleanupRecycleBin(req, res) {

  const cnn = await pool.getConnection();
  try {
    // Species
    await cnn.query(`
      DELETE FROM softDelete_species 
      WHERE deleted_at < NOW() - INTERVAL 30 DAY
    `);

    // Ingredients (use created_at since softDelete_ingredients lacks deleted_at)
    await cnn.query(`
      DELETE FROM softDelete_ingredients
      WHERE created_at < NOW() - INTERVAL 30 DAY
    `);

    // Feeds (also lacks deleted_at, so use created_at)
    await cnn.query(`
      DELETE FROM softDelete_feeds
      WHERE created_at < NOW() - INTERVAL 30 DAY
    `);

    res.status(200).json({ message: 'Recycle bin cleanup completed.' });
  } catch (error) {
    console.error('Error cleaning recycle bin:', error);
    res.status(500).json({ error: 'Failed to clean recycle bin' });
  }
}

module.exports = { restoreFeed ,cleanupRecycleBin};
