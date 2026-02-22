-- WB Cyber Club Database Schema

-- Таблица турниров
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    discipline VARCHAR(100) NOT NULL,
    date VARCHAR(100) NOT NULL,
    prize VARCHAR(100) NOT NULL,
    teams INTEGER DEFAULT 0,
    max_teams INTEGER NOT NULL,
    registration_link TEXT,
    custom_link TEXT,
    status VARCHAR(50) DEFAULT 'active',
    winner VARCHAR(255),
    watch_url TEXT,
    start_time TIME,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Календарь активностей
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

-- Таблица ссылок на регистрацию
CREATE TABLE IF NOT EXISTS registration_links (
    id SERIAL PRIMARY KEY,
    discipline VARCHAR(100) UNIQUE NOT NULL,
    link TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица социальных ссылок
CREATE TABLE IF NOT EXISTS social_links (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) UNIQUE NOT NULL,
    link TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица дисциплин
CREATE TABLE IF NOT EXISTS disciplines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7),
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица зарегистрированных команд
CREATE TABLE IF NOT EXISTS registered_teams (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    captain VARCHAR(255) NOT NULL,
    players INTEGER NOT NULL,
    registration_date VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка дефолтных дисциплин
INSERT INTO disciplines (name) VALUES 
    ('CS 2'),
    ('Dota 2'),
    ('Valorant'),
    ('Overwatch 2'),
    ('League of Legends')
ON CONFLICT (name) DO NOTHING;

-- Таблица регламентов по дисциплинам
CREATE TABLE IF NOT EXISTS regulations (
    id SERIAL PRIMARY KEY,
    discipline_name VARCHAR(100) NOT NULL,
    regulation_name VARCHAR(255),
    pdf_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_discipline ON tournaments(discipline);
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON registered_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_regulations_discipline ON regulations(discipline_name);

-- Индексы календаря (используются в range query и JOIN по tournament_id)
CREATE INDEX IF NOT EXISTS idx_calendar_event_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_tournament_id ON calendar_events(tournament_id);

