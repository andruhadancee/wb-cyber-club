const { Pool, types } = require('pg');

// Отключаем конвертацию DATE и TIMESTAMP в JS Date —
// возвращаем как строки, чтобы не было сдвига из-за часовых поясов
types.setTypeParser(1082, (val) => val);          // DATE → "2026-02-12"
types.setTypeParser(1114, (val) => val);          // TIMESTAMP → as-is
types.setTypeParser(1184, (val) => val);          // TIMESTAMPTZ → as-is

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
