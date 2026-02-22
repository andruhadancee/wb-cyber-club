-- Migration: discipline name → discipline_id FK
-- Step 1: Ensure all referenced discipline names exist in disciplines table
INSERT INTO disciplines (name, created_at, updated_at)
SELECT DISTINCT t.discipline, NOW(), NOW()
FROM tournaments t
WHERE t.discipline IS NOT NULL AND t.discipline != ''
  AND NOT EXISTS (SELECT 1 FROM disciplines d WHERE d.name = t.discipline)
ON CONFLICT (name) DO NOTHING;

INSERT INTO disciplines (name, created_at, updated_at)
SELECT DISTINCT ce.discipline, NOW(), NOW()
FROM calendar_events ce
WHERE ce.discipline IS NOT NULL AND ce.discipline != ''
  AND NOT EXISTS (SELECT 1 FROM disciplines d WHERE d.name = ce.discipline)
ON CONFLICT (name) DO NOTHING;

INSERT INTO disciplines (name, created_at, updated_at)
SELECT DISTINCT rl.discipline, NOW(), NOW()
FROM registration_links rl
WHERE rl.discipline IS NOT NULL AND rl.discipline != ''
  AND NOT EXISTS (SELECT 1 FROM disciplines d WHERE d.name = rl.discipline)
ON CONFLICT (name) DO NOTHING;

INSERT INTO disciplines (name, created_at, updated_at)
SELECT DISTINCT r.discipline_name, NOW(), NOW()
FROM regulations r
WHERE r.discipline_name IS NOT NULL AND r.discipline_name != ''
  AND NOT EXISTS (SELECT 1 FROM disciplines d WHERE d.name = r.discipline_name)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Add discipline_id columns
ALTER TABLE "tournaments" ADD COLUMN "discipline_id" INTEGER;
ALTER TABLE "calendar_events" ADD COLUMN "discipline_id" INTEGER;
ALTER TABLE "registration_links" ADD COLUMN "discipline_id" INTEGER;
ALTER TABLE "regulations" ADD COLUMN "discipline_id" INTEGER;

-- Step 3: Populate discipline_id from existing names
UPDATE "tournaments" t SET "discipline_id" = d.id FROM "disciplines" d WHERE t."discipline" = d."name";
UPDATE "calendar_events" ce SET "discipline_id" = d.id FROM "disciplines" d WHERE ce."discipline" = d."name";
UPDATE "registration_links" rl SET "discipline_id" = d.id FROM "disciplines" d WHERE rl."discipline" = d."name";
UPDATE "regulations" r SET "discipline_id" = d.id FROM "disciplines" d WHERE r."discipline_name" = d."name";

-- Step 4: Drop old constraints and indexes
ALTER TABLE "registration_links" DROP CONSTRAINT IF EXISTS "registration_links_discipline_key";
DROP INDEX IF EXISTS "idx_tournaments_discipline";
DROP INDEX IF EXISTS "idx_regulations_discipline";

-- Step 5: Drop old string columns
ALTER TABLE "tournaments" DROP COLUMN "discipline";
ALTER TABLE "calendar_events" DROP COLUMN "discipline";
ALTER TABLE "registration_links" DROP COLUMN "discipline";
ALTER TABLE "regulations" DROP COLUMN "discipline_name";

-- Step 6: Make NOT NULL where required
ALTER TABLE "tournaments" ALTER COLUMN "discipline_id" SET NOT NULL;
ALTER TABLE "registration_links" ALTER COLUMN "discipline_id" SET NOT NULL;
ALTER TABLE "regulations" ALTER COLUMN "discipline_id" SET NOT NULL;

-- Step 7: Add foreign key constraints
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_discipline_id_fkey"
  FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_discipline_id_fkey"
  FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "registration_links" ADD CONSTRAINT "registration_links_discipline_id_fkey"
  FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_discipline_id_fkey"
  FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Add new indexes
CREATE UNIQUE INDEX "registration_links_discipline_id_key" ON "registration_links"("discipline_id");
CREATE INDEX "idx_tournaments_discipline" ON "tournaments"("discipline_id");
CREATE INDEX "idx_regulations_discipline" ON "regulations"("discipline_id");
