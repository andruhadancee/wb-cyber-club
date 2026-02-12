const { Router } = require('express');
const pool = require('../db.cjs');

const router = Router();

// GET /api/social
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM social_links');
    const links = {};
    result.rows.forEach((row) => {
      links[row.platform] = row.link;
    });
    return res.json(links);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// POST /api/social
router.post('/', async (req, res) => {
  try {
    const { twitch, telegram, discord, contact } = req.body;
    await pool.query('DELETE FROM social_links');
    const platforms = [
      { platform: 'twitch', link: twitch },
      { platform: 'telegram', link: telegram },
      { platform: 'discord', link: discord },
      { platform: 'contact', link: contact },
    ];
    for (const { platform, link } of platforms) {
      if (link && link.trim()) {
        await pool.query(
          'INSERT INTO social_links (platform, link) VALUES ($1, $2)',
          [platform, link.trim()]
        );
      }
    }
    return res.json({ message: 'Социальные ссылки сохранены' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

module.exports = router;
