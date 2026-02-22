-- Migration: discipline_name/discipline → discipline_id (FK)
-- Идемпотентная — безопасно запускать повторно

-- === tournaments ===
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'discipline_id'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN discipline_id INT;

    -- Бэкфилл из старого varchar столбца discipline
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'tournaments' AND column_name = 'discipline'
    ) THEN
      UPDATE tournaments t
      SET discipline_id = d.id
      FROM disciplines d
      WHERE t.discipline = d.name;
    END IF;

    -- Фоллбэк: если не замапилось, ставим первую дисциплину
    UPDATE tournaments
    SET discipline_id = (SELECT id FROM disciplines ORDER BY id LIMIT 1)
    WHERE discipline_id IS NULL;

    ALTER TABLE tournaments ALTER COLUMN discipline_id SET NOT NULL;
  END IF;
END $$;

-- === calendar_events ===
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
    -- nullable, не ставим NOT NULL
  END IF;
END $$;

-- === registration_links ===
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

-- === regulations ===
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
