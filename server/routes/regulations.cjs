const { Router } = require('express');
const pool = require('../db.cjs');

const router = Router();

// GET /api/regulations
router.get('/', async (req, res) => {
  try {
    const { discipline } = req.query;
    if (discipline) {
      const result = await pool.query(
        `SELECT r.id, r.discipline_name, r.pdf_url, r.regulation_name, r.created_at, r.updated_at
         FROM regulations r
         WHERE LOWER(r.discipline_name) = LOWER($1)`,
        [discipline]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Regulation not found' });
      return res.json(result.rows);
    }
    const result = await pool.query(
      `SELECT r.id, r.discipline_name, r.pdf_url, r.regulation_name, r.created_at, r.updated_at
       FROM regulations r
       ORDER BY r.discipline_name, r.regulation_name`
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/regulations
router.post('/', async (req, res) => {
  try {
    const { discipline_name, pdf_url, regulation_name } = req.body;
    if (!discipline_name || !pdf_url) {
      return res.status(400).json({ error: 'discipline_name and pdf_url are required' });
    }
    const result = await pool.query(
      'INSERT INTO regulations (discipline_name, pdf_url, regulation_name) VALUES ($1, $2, $3) RETURNING *',
      [discipline_name, pdf_url, regulation_name || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// PUT /api/regulations?id=...
router.put('/', async (req, res) => {
  try {
    const { id } = req.query;
    const { pdf_url, discipline_name, regulation_name } = req.body;
    if (!id || !pdf_url) {
      return res.status(400).json({ error: 'id and pdf_url are required' });
    }
    const result = await pool.query(
      `UPDATE regulations 
       SET pdf_url = $1, updated_at = CURRENT_TIMESTAMP, 
           discipline_name = COALESCE($2, discipline_name),
           regulation_name = COALESCE($3, regulation_name)
       WHERE id = $4
       RETURNING *`,
      [pdf_url, discipline_name, regulation_name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Regulation not found' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/regulations?id=...
router.delete('/', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });
    const result = await pool.query('DELETE FROM regulations WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Regulation not found' });
    return res.json({ message: 'Regulation deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
