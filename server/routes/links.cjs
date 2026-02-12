const { Router } = require('express');
const pool = require('../db.cjs');

const router = Router();

// GET /api/links
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM registration_links ORDER BY discipline');
    const links = {};
    result.rows.forEach((row) => {
      links[row.discipline] = row.link;
    });
    return res.json(links);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// POST /api/links
router.post('/', async (req, res) => {
  try {
    const links = req.body;
    await pool.query('DELETE FROM registration_links');
    for (const [discipline, link] of Object.entries(links)) {
      if (link && link.trim()) {
        await pool.query(
          'INSERT INTO registration_links (discipline, link) VALUES ($1, $2)',
          [discipline, link.trim()]
        );
      }
    }
    return res.json({ message: 'Ссылки сохранены', links });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

module.exports = router;
