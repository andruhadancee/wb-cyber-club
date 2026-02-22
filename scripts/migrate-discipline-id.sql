-- Migration: полная синхронизация схемы (discipline_id + новые поля)
-- Идемпотентная — безопасно запускать повторно

-- ═══════════════════════════════════════════
-- tournaments: discipline → discipline_id
-- ═══════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'discipline_id'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN discipline_id INT;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tournaments' AND column_name = 'discipline'
    ) THEN
      UPDATE tournaments t
      SET discipline_id = d.id
      FROM disciplines d
      WHERE t.discipline = d.name;
    END IF;

    UPDATE tournaments
    SET discipline_id = (SELECT id FROM disciplines ORDER BY id LIMIT 1)
    WHERE discipline_id IS NULL;

    ALTER TABLE tournaments ALTER COLUMN discipline_id SET NOT NULL;
  END IF;
END $$;

-- tournaments: winner_2nd, winner_3rd
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'winner_2nd'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN winner_2nd VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'winner_3rd'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN winner_3rd VARCHAR(255);
  END IF;
END $$;

-- ═══════════════════════════════════════════
-- calendar_events: discipline → discipline_id
-- ═══════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'discipline_id'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN discipline_id INT;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'calendar_events' AND column_name = 'discipline'
    ) THEN
      UPDATE calendar_events ce
      SET discipline_id = d.id
      FROM disciplines d
      WHERE ce.discipline = d.name;
    END IF;
  END IF;
END $$;

-- ═══════════════════════════════════════════
-- registration_links: discipline → discipline_id
-- ═══════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registration_links' AND column_name = 'discipline_id'
  ) THEN
    ALTER TABLE registration_links ADD COLUMN discipline_id INT;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'registration_links' AND column_name = 'discipline'
    ) THEN
      UPDATE registration_links rl
      SET discipline_id = d.id
      FROM disciplines d
      WHERE rl.discipline = d.name;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'registration_links' AND column_name = 'discipline_name'
    ) THEN
      UPDATE registration_links rl
      SET discipline_id = d.id
      FROM disciplines d
      WHERE rl.discipline_name = d.name;
    END IF;

    UPDATE registration_links
    SET discipline_id = (SELECT id FROM disciplines ORDER BY id LIMIT 1)
    WHERE discipline_id IS NULL;

    ALTER TABLE registration_links ALTER COLUMN discipline_id SET NOT NULL;
  END IF;
END $$;

-- ═══════════════════════════════════════════
-- regulations: discipline_name → discipline_id
-- ═══════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'regulations' AND column_name = 'discipline_id'
  ) THEN
    ALTER TABLE regulations ADD COLUMN discipline_id INT;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'regulations' AND column_name = 'discipline_name'
    ) THEN
      UPDATE regulations r
      SET discipline_id = d.id
      FROM disciplines d
      WHERE r.discipline_name = d.name;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'regulations' AND column_name = 'discipline'
    ) THEN
      UPDATE regulations r
      SET discipline_id = d.id
      FROM disciplines d
      WHERE r.discipline = d.name;
    END IF;

    UPDATE regulations
    SET discipline_id = (SELECT id FROM disciplines ORDER BY id LIMIT 1)
    WHERE discipline_id IS NULL;

    ALTER TABLE regulations ALTER COLUMN discipline_id SET NOT NULL;
  END IF;
END $$;

-- ═══════════════════════════════════════════
-- bracket_matches: индекс idx_bracket_lookup
-- ═══════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_bracket_lookup'
  ) THEN
    CREATE INDEX idx_bracket_lookup
    ON bracket_matches (tournament_id, bracket_side, round, position);
  END IF;
END $$;

-- ═══════════════════════════════════════════
-- Удаление старых varchar-столбцов
-- (после бэкфилла они больше не нужны)
-- ═══════════════════════════════════════════
DO $$
BEGIN
  -- tournaments.discipline (varchar)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'discipline' AND data_type = 'character varying'
  ) THEN
    -- Сначала убираем индекс если он на varchar
    DROP INDEX IF EXISTS idx_tournaments_discipline;
    ALTER TABLE tournaments DROP COLUMN discipline;
    -- Prisma db push создаст новый индекс на discipline_id
  END IF;

  -- calendar_events.discipline (varchar)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'discipline' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE calendar_events DROP COLUMN discipline;
  END IF;

  -- registration_links.discipline (varchar)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registration_links' AND column_name = 'discipline' AND data_type = 'character varying'
  ) THEN
    DROP INDEX IF EXISTS registration_links_discipline_key;
    ALTER TABLE registration_links DROP COLUMN discipline;
  END IF;

  -- registration_links.discipline_name (varchar)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registration_links' AND column_name = 'discipline_name'
  ) THEN
    ALTER TABLE registration_links DROP COLUMN discipline_name;
  END IF;

  -- regulations.discipline_name (varchar)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'regulations' AND column_name = 'discipline_name'
  ) THEN
    DROP INDEX IF EXISTS idx_regulations_discipline;
    ALTER TABLE regulations DROP COLUMN discipline_name;
  END IF;
END $$;
