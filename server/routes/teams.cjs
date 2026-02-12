const { Router } = require('express');
const pool = require('../db.cjs');

const router = Router();

// GET /api/teams
router.get('/', async (req, res) => {
  try {
    const { tournamentId } = req.query;
    let query = 'SELECT * FROM registered_teams';
    let params = [];
    if (tournamentId) {
      query += ' WHERE tournament_id = $1';
      params = [tournamentId];
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);

    // Группируем по турнирам
    const teamsByTournament = {};
    result.rows.forEach((team) => {
      if (!teamsByTournament[team.tournament_id]) {
        teamsByTournament[team.tournament_id] = [];
      }
      teamsByTournament[team.tournament_id].push(team);
    });

    return res.json(teamsByTournament);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// POST /api/teams
router.post('/', async (req, res) => {
  try {
    const { tournamentId, name, players } = req.body;
    const result = await pool.query(
      `INSERT INTO registered_teams 
      (tournament_id, name, players, captain, registration_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [tournamentId, name, players, '', new Date().toLocaleDateString('ru-RU')]
    );

    // Обновляем счётчик команд в турнире
    await pool.query(
      `UPDATE tournaments 
      SET teams = (SELECT COUNT(*) FROM registered_teams WHERE tournament_id = $1)
      WHERE id = $1`,
      [tournamentId]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// PUT /api/teams
router.put('/', async (req, res) => {
  try {
    const { id, tournamentId, name, players } = req.body;
    const result = await pool.query(
      `UPDATE registered_teams 
      SET tournament_id = $1, name = $2, players = $3
      WHERE id = $4
      RETURNING *`,
      [tournamentId, name, players, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Команда не найдена' });

    await pool.query(
      `UPDATE tournaments 
      SET teams = (SELECT COUNT(*) FROM registered_teams WHERE tournament_id = $1)
      WHERE id = $1`,
      [tournamentId]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// DELETE /api/teams?id=...
router.delete('/', async (req, res) => {
  try {
    const { id } = req.query;
    const result = await pool.query('DELETE FROM registered_teams WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Команда не найдена' });

    const tournamentId = result.rows[0].tournament_id;
    await pool.query(
      `UPDATE tournaments 
      SET teams = (SELECT COUNT(*) FROM registered_teams WHERE tournament_id = $1)
      WHERE id = $1`,
      [tournamentId]
    );

    return res.json({ message: 'Команда удалена' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

module.exports = router;
