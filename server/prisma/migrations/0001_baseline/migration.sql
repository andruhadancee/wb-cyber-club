-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "tournaments" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "date" VARCHAR(100) NOT NULL,
    "prize" VARCHAR(100) NOT NULL,
    "teams" INTEGER NOT NULL DEFAULT 0,
    "max_teams" INTEGER NOT NULL,
    "registration_link" TEXT,
    "custom_link" TEXT,
    "status" VARCHAR(50) DEFAULT 'active',
    "winner" VARCHAR(255),
    "winner_2nd" VARCHAR(255),
    "winner_3rd" VARCHAR(255),
    "watch_url" TEXT,
    "start_time" TIME,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "event_date" DATE NOT NULL,
    "image_url" TEXT,
    "discipline_id" INTEGER,
    "prize" VARCHAR(100),
    "max_teams" INTEGER,
    "registration_link" TEXT,
    "custom_link" TEXT,
    "tournament_id" INTEGER,
    "start_time" TIME,
    "watch_url" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_links" (
    "id" SERIAL NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" SERIAL NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplines" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7),
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registered_teams" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "captain" VARCHAR(255) NOT NULL,
    "players" INTEGER NOT NULL,
    "registration_date" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registered_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bracket_matches" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "team1_id" INTEGER,
    "team2_id" INTEGER,
    "winner_id" INTEGER,
    "team1_name" VARCHAR(255),
    "team2_name" VARCHAR(255),
    "winner_name" VARCHAR(255),
    "score1" INTEGER,
    "score2" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "bracket_side" VARCHAR(20) NOT NULL DEFAULT 'upper',
    "scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bracket_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulations" (
    "id" SERIAL NOT NULL,
    "discipline_id" INTEGER NOT NULL,
    "regulation_name" VARCHAR(255),
    "pdf_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_tournaments_status" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "idx_tournaments_discipline" ON "tournaments"("discipline_id");

-- CreateIndex
CREATE INDEX "idx_calendar_event_date" ON "calendar_events"("event_date");

-- CreateIndex
CREATE INDEX "idx_calendar_tournament_id" ON "calendar_events"("tournament_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_links_discipline_id_key" ON "registration_links"("discipline_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_links_platform_key" ON "social_links"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "disciplines_name_key" ON "disciplines"("name");

-- CreateIndex
CREATE INDEX "idx_teams_tournament" ON "registered_teams"("tournament_id");

-- CreateIndex
CREATE INDEX "idx_bracket_tournament" ON "bracket_matches"("tournament_id");

-- CreateIndex
CREATE INDEX "idx_bracket_lookup" ON "bracket_matches"("tournament_id", "bracket_side", "round", "position");

-- CreateIndex
CREATE INDEX "idx_regulations_discipline" ON "regulations"("discipline_id");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_links" ADD CONSTRAINT "registration_links_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registered_teams" ADD CONSTRAINT "registered_teams_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_team1_id_fkey" FOREIGN KEY ("team1_id") REFERENCES "registered_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_team2_id_fkey" FOREIGN KEY ("team2_id") REFERENCES "registered_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "registered_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

