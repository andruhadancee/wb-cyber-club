const { Router } = require('express');
const pool = require('../db.cjs');

const router = Router();

// GET /api/archive-auto — автоматический перенос прошедших турниров в архив
router.get('/', async (req, res) => {
  try {
    console.log('Running auto-archive...');
    const tournaments = await pool.query('SELECT * FROM tournaments WHERE status = $1', ['active']);

    if (tournaments.rows.length === 0) {
      return res.json({ message: 'Нет турниров для архивирования', archived: 0 });
    }

    const now = new Date();
    const todayDateStr = now.toISOString().slice(0, 10);
    let archivedCount = 0;

    for (const tournament of tournaments.rows) {
      try {
        const dateMatch = tournament.date.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
        if (!dateMatch) continue;

        const months = {
          'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
          'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
          'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12',
        };
        const day = dateMatch[1].padStart(2, '0');
        const month = months[dateMatch[2].toLowerCase()];
        const year = dateMatch[3];
        if (!month) continue;

        const tournamentDateStr = `${year}-${month}-${day}`;
        if (tournamentDateStr <= todayDateStr) {
          await pool.query(
            'UPDATE tournaments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['finished', tournament.id]
          );
          try {
            await pool.query('DELETE FROM calendar_events WHERE tournament_id = $1', [tournament.id]);
          } catch (err) {
            console.error('Error deleting calendar event:', err);
          }
          archivedCount++;
          console.log(`Archived tournament "${tournament.title}" (ID: ${tournament.id})`);
        }
      } catch (err) {
        console.error(`Error archiving tournament ${tournament.id}:`, err);
      }
    }

    console.log(`Archived: ${archivedCount}`);
    return res.json({ message: 'Архивирование завершено', archived: archivedCount });
  } catch (error) {
    console.error('Auto-archive error:', error);
    return res.status(500).json({ error: 'Ошибка архивирования', details: error.message });
  }
});

module.exports = router;
