const { Router } = require('express');
const pool = require('../db.cjs');

const router = Router();

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      event_date DATE NOT NULL,
      image_url TEXT,
      discipline VARCHAR(100),
      prize VARCHAR(100),
      max_teams INTEGER,
      registration_link TEXT,
      custom_link TEXT,
      tournament_id INTEGER,
      start_time TIME,
      watch_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try {
    await pool.query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS discipline VARCHAR(100)');
    await pool.query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS prize VARCHAR(100)');
    await pool.query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS max_teams INTEGER');
    await pool.query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS registration_link TEXT');
    await pool.query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS custom_link TEXT');
    await pool.query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS tournament_id INTEGER');
    await pool.query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS start_time TIME');
    await pool.query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS watch_url TEXT');
  } catch (e) {
    // Колонки уже существуют
  }
}

// GET /api/calendar
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const { month } = req.query;
    let query = 'SELECT * FROM calendar_events';
    const params = [];
    if (month) {
      query += " WHERE to_char(event_date, 'YYYY-MM') = $1";
      params.push(month);
    }
    query += ' ORDER BY event_date ASC, created_at DESC';
    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('Calendar API error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// POST /api/calendar
router.post('/', async (req, res) => {
  try {
    await ensureTable();
    const { title, description, eventDate, imageUrl, discipline, prize, maxTeams, registrationLink, customLink, startTime, watchUrl } = req.body;
    if (!title || !eventDate) {
      return res.status(400).json({ error: 'title и eventDate обязательны' });
    }

    let tournamentId = null;
    // Автоматически создаём турнир если указаны обязательные поля
    if (discipline && prize && maxTeams) {
      try {
        const existingTournament = await pool.query(
          `SELECT id FROM tournaments WHERE title = $1 AND date = $2 AND discipline = $3 AND status = 'active' LIMIT 1`,
          [title, eventDate, discipline]
        );
        if (existingTournament.rows.length > 0) {
          tournamentId = existingTournament.rows[0].id;
          if (watchUrl && watchUrl.trim()) {
            try {
              await pool.query('UPDATE tournaments SET watch_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [watchUrl.trim(), tournamentId]);
            } catch (err) {
              console.error('Error updating tournament watch_url:', err);
            }
          }
        } else {
          const tournamentResult = await pool.query(
            `INSERT INTO tournaments (title, discipline, date, prize, max_teams, custom_link, status, teams, watch_url, start_time)
             VALUES ($1, $2, $3, $4, $5, $6, 'active', 0, $7, $8)
             RETURNING id`,
            [title, discipline, eventDate, prize, maxTeams, customLink || registrationLink || null, watchUrl || null, startTime || null]
          );
          tournamentId = tournamentResult.rows[0].id;
        }
      } catch (err) {
        console.error('Error creating tournament:', err);
      }
    }

    // Проверяем, нет ли уже события
    const existingEvent = await pool.query(
      'SELECT id FROM calendar_events WHERE tournament_id = $1 OR (title = $2 AND event_date = $3::date) LIMIT 1',
      [tournamentId, title, eventDate]
    );

    if (existingEvent.rows.length > 0) {
      const result = await pool.query(
        `UPDATE calendar_events 
         SET title = $1, description = $2, image_url = $3, discipline = $4, prize = $5, max_teams = $6, registration_link = $7, custom_link = $8, tournament_id = $9, start_time = $10, watch_url = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12
         RETURNING *`,
        [title, description || null, imageUrl || null, discipline || null, prize || null, maxTeams || null, registrationLink || null, customLink || null, tournamentId, startTime || null, watchUrl || null, existingEvent.rows[0].id]
      );
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO calendar_events (title, description, event_date, image_url, discipline, prize, max_teams, registration_link, custom_link, tournament_id, start_time, watch_url)
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [title, description || null, eventDate, imageUrl || null, discipline || null, prize || null, maxTeams || null, registrationLink || null, customLink || null, tournamentId, startTime || null, watchUrl || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Calendar API error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// PUT /api/calendar
router.put('/', async (req, res) => {
  try {
    const { id, title, description, eventDate, imageUrl, discipline, prize, maxTeams, registrationLink, customLink, startTime, watchUrl } = req.body;

    // Обновляем связанный турнир
    const currentEvent = await pool.query('SELECT tournament_id FROM calendar_events WHERE id = $1', [id]);
    if (currentEvent.rows.length > 0 && currentEvent.rows[0].tournament_id) {
      try {
        await pool.query(
          `UPDATE tournaments 
           SET title = $1, discipline = $2, date = $3, prize = $4, max_teams = $5, custom_link = $6, start_time = $7, watch_url = $8, updated_at = CURRENT_TIMESTAMP
           WHERE id = $9`,
          [title, discipline || null, eventDate, prize || null, maxTeams || null, customLink || registrationLink || null, startTime || null, watchUrl || null, currentEvent.rows[0].tournament_id]
        );
      } catch (err) {
        console.error('Error updating tournament:', err);
      }
    }

    const result = await pool.query(
      `UPDATE calendar_events
       SET title = $1, description = $2, event_date = $3::date, image_url = $4, discipline = $5, prize = $6, max_teams = $7, registration_link = $8, custom_link = $9, start_time = $10, watch_url = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [title, description || null, eventDate, imageUrl || null, discipline || null, prize || null, maxTeams || null, registrationLink || null, customLink || null, startTime || null, watchUrl || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Событие не найдено' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Calendar API error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// DELETE /api/calendar?id=...
router.delete('/', async (req, res) => {
  try {
    const { id } = req.query;
    const eventResult = await pool.query('SELECT * FROM calendar_events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) return res.status(404).json({ error: 'Событие не найдено' });

    const event = eventResult.rows[0];
    const result = await pool.query('DELETE FROM calendar_events WHERE id = $1 RETURNING *', [id]);

    // Удаляем связанный турнир если больше нет событий
    if (event.tournament_id) {
      try {
        const otherEvents = await pool.query('SELECT COUNT(*) as count FROM calendar_events WHERE tournament_id = $1', [event.tournament_id]);
        if (otherEvents.rows[0].count === '0') {
          await pool.query('DELETE FROM tournaments WHERE id = $1', [event.tournament_id]);
        }
      } catch (err) {
        console.error('Error deleting linked tournament:', err);
      }
    }

    return res.json({ message: 'Удалено', event: result.rows[0] });
  } catch (error) {
    console.error('Calendar API error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

module.exports = router;
