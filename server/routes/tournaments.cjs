const { Router } = require('express');
const pool = require('../db.cjs');

const router = Router();

// Автоматическое добавление полей если их нет
async function ensureMigrations() {
  try {
    await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS start_time TIME');
    await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS image_url TEXT');
  } catch (e) {
    // Колонки уже существуют
  }
}

// Вспомогательная функция парсинга русской даты в YYYY-MM-DD
function parseRussianDateToISO(dateStr) {
  const months = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
    'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
    'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12',
  };
  const russianFormat = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+г\.)?/);
  if (russianFormat) {
    const day = russianFormat[1].padStart(2, '0');
    const month = months[russianFormat[2].toLowerCase()];
    const year = russianFormat[3];
    if (month) return `${year}-${month}-${day}`;
  }
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
  return null;
}

// Вспомогательная функция сортировки дат
function parseDateForSort(dateStr) {
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(dateStr);
  const months = {
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
    'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
    'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
  };
  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const month = months[match[2].toLowerCase()];
    if (month !== undefined) return new Date(parseInt(match[3]), month, parseInt(match[1]));
  }
  return new Date(dateStr);
}

// GET /api/tournaments
router.get('/', async (req, res) => {
  await ensureMigrations();
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM tournaments';
    let params = [];
    if (status) {
      query += ' WHERE status = $1';
      params = [status];
    }
    query += ' ORDER BY date ASC';
    const result = await pool.query(query, params);

    // Сортируем по дате
    result.rows.sort((a, b) => {
      const dateA = parseDateForSort(a.date);
      const dateB = parseDateForSort(b.date);
      if (a.start_time && b.start_time) {
        const timeA = a.start_time.match(/(\d{1,2}):(\d{2})/);
        const timeB = b.start_time.match(/(\d{1,2}):(\d{2})/);
        if (timeA && timeB) {
          dateA.setHours(parseInt(timeA[1]), parseInt(timeA[2]), 0, 0);
          dateB.setHours(parseInt(timeB[1]), parseInt(timeB[2]), 0, 0);
        }
      }
      return dateA - dateB;
    });

    // Автоматически создаём события календаря для активных турниров без события
    for (const tournament of result.rows) {
      if (tournament.status === 'active' && tournament.date) {
        try {
          const existingEvent = await pool.query(
            'SELECT id FROM calendar_events WHERE tournament_id = $1',
            [tournament.id]
          );
          if (existingEvent.rows.length === 0) {
            const eventDateStr = parseRussianDateToISO(tournament.date);
            if (eventDateStr) {
              await pool.query(
                `INSERT INTO calendar_events (title, description, event_date, image_url, discipline, prize, max_teams, registration_link, custom_link, tournament_id, start_time, watch_url)
                 VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [tournament.title, null, eventDateStr, null, tournament.discipline || null, tournament.prize || null, tournament.max_teams || null, null, tournament.custom_link || null, tournament.id, tournament.start_time || null, tournament.watch_url || null]
              );
              console.log(`Created calendar event for tournament ${tournament.id}`);
            }
          }
        } catch (err) {
          console.error(`Error migrating tournament ${tournament.id}:`, err);
        }
      }
    }

    return res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// POST /api/tournaments
router.post('/', async (req, res) => {
  await ensureMigrations();
  try {
    const { title, discipline, date, prize, maxTeams, customLink, status, winner, watchUrl, description, imageUrl, startTime, teams } = req.body;
    const teamsCount = (status === 'finished' && teams !== undefined) ? teams : 0;

    const result = await pool.query(
      `INSERT INTO tournaments 
      (title, discipline, date, prize, max_teams, custom_link, status, winner, teams, watch_url, start_time, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [title, discipline, date, prize, maxTeams, customLink || null, status || 'active', winner || null, teamsCount, watchUrl || null, startTime || null, imageUrl || null]
    );
    const tournament = result.rows[0];

    // Автоматически создаём событие календаря для активных турниров
    if (tournament.status === 'active' && date) {
      try {
        const existingEvent = await pool.query('SELECT id FROM calendar_events WHERE tournament_id = $1', [tournament.id]);
        if (existingEvent.rows.length === 0) {
          const eventDateStr = parseRussianDateToISO(date);
          if (eventDateStr) {
            await pool.query(
              `INSERT INTO calendar_events (title, description, event_date, image_url, discipline, prize, max_teams, registration_link, custom_link, tournament_id, start_time, watch_url)
               VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [title, description || null, eventDateStr, imageUrl || null, discipline || null, prize || null, maxTeams || null, null, customLink || null, tournament.id, startTime || null, watchUrl || null]
            );
            console.log(`Created calendar event for tournament ${tournament.id}`);
          }
        }
      } catch (err) {
        console.error('Error creating calendar event:', err);
      }
    }

    return res.status(201).json(tournament);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// PUT /api/tournaments
router.put('/', async (req, res) => {
  await ensureMigrations();
  try {
    const { id, title, discipline, date, prize, maxTeams, customLink, status, winner, watchUrl, startTime, imageUrl, teams } = req.body;
    const values = [title, discipline, date, prize, maxTeams, customLink || null, status, winner || null, watchUrl || null, startTime || null, imageUrl || null];

    let updateQuery = `UPDATE tournaments 
      SET title = $1, discipline = $2, date = $3, prize = $4, 
          max_teams = $5, custom_link = $6, status = $7, winner = $8, watch_url = $9, start_time = $10, image_url = $11`;

    if (status === 'finished' && teams !== undefined) {
      updateQuery += `, teams = $12`;
      values.push(teams);
    }
    updateQuery += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Турнир не найден' });

    const tournament = result.rows[0];

    // Обновляем или удаляем связанное событие календаря
    if (tournament.status === 'active' && date) {
      try {
        const eventDateStr = parseRussianDateToISO(date);
        if (eventDateStr) {
          await pool.query(
            `UPDATE calendar_events 
             SET title = $1, description = $2, event_date = $3::date, image_url = $4, discipline = $5, prize = $6, max_teams = $7, custom_link = $8, start_time = $9, watch_url = $10, updated_at = CURRENT_TIMESTAMP
             WHERE tournament_id = $11`,
            [title, req.body.description || null, eventDateStr, req.body.imageUrl || null, discipline || null, prize || null, maxTeams || null, customLink || null, startTime || null, watchUrl || null, id]
          );
        }
      } catch (err) {
        console.error('Error updating calendar event:', err);
      }
    } else if (tournament.status === 'finished') {
      try {
        await pool.query('DELETE FROM calendar_events WHERE tournament_id = $1', [id]);
      } catch (err) {
        console.error('Error deleting calendar event:', err);
      }
    }

    return res.json(tournament);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// DELETE /api/tournaments?id=...
router.delete('/', async (req, res) => {
  try {
    const { id } = req.query;
    try {
      await pool.query('DELETE FROM calendar_events WHERE tournament_id = $1', [id]);
    } catch (err) {
      console.error('Error deleting calendar event:', err);
    }
    const result = await pool.query('DELETE FROM tournaments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Турнир не найден' });
    return res.json({ message: 'Турнир удалён', tournament: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

module.exports = router;
