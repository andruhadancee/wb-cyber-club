const { Router } = require('express');
const pool = require('../db.cjs');

const router = Router();

async function ensureColumns() {
  try {
    await pool.query('ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS color VARCHAR(7)');
    await pool.query('ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS logo_url TEXT');
    await pool.query('ALTER TABLE disciplines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  } catch (e) {
    // Колонки уже существуют
  }
}

// GET /api/disciplines
router.get('/', async (req, res) => {
  await ensureColumns();
  try {
    const result = await pool.query('SELECT id, name, color, logo_url FROM disciplines ORDER BY name');
    return res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// POST /api/disciplines
router.post('/', async (req, res) => {
  await ensureColumns();
  try {
    const { name, color, logo_url } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название дисциплины обязательно' });
    }
    try {
      const result = await pool.query(
        'INSERT INTO disciplines (name, color, logo_url) VALUES ($1, $2, $3) RETURNING *',
        [name.trim(), color || null, logo_url || null]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Дисциплина уже существует' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// PUT /api/disciplines
router.put('/', async (req, res) => {
  await ensureColumns();
  try {
    const { id, name, color, logo_url } = req.body;
    if (!id) return res.status(400).json({ error: 'ID дисциплины обязателен' });

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(color || null);
    }
    if (logo_url !== undefined) {
      updates.push(`logo_url = $${paramIndex++}`);
      values.push(logo_url || null);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Нет данных для обновления' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await pool.query(
      `UPDATE disciplines SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Дисциплина не найдена' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// DELETE /api/disciplines?name=...
router.delete('/', async (req, res) => {
  try {
    const { name } = req.query;
    const result = await pool.query('DELETE FROM disciplines WHERE name = $1 RETURNING *', [name]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Дисциплина не найдена' });
    return res.json({ message: 'Дисциплина удалена' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

module.exports = router;
