# WB Cyber Club

Платформа киберспортивных турниров. React SPA + Express API + PostgreSQL.

## Стек

**Frontend:** React, TypeScript, Zustand, React Hook Form, Zod, Vite, FSD  
**Backend:** Express.js, Node.js, PostgreSQL (`pg`)  
**Инфраструктура:** Docker, Nginx, Let's Encrypt (Certbot)

---

## Деплой на Timeweb Cloud (пошагово)

### Шаг 1. Купить VPS

1. Зайди на [cloud.timeweb.com](https://cloud.timeweb.com) и зарегистрируйся
2. **Облачные серверы** -> **Создать**
3. Параметры:
   - **ОС:** Ubuntu 22.04
   - **Конфигурация:** минимальная (1 vCPU / 1 GB RAM / 15 GB SSD)
   - **Регион:** Москва или Санкт-Петербург
4. Запомни **пароль root** и **IP-адрес** сервера (например `185.104.xx.xx`)

### Шаг 2. Привязать домен

В панели управления твоего регистратора домена:

1. Перейди в **DNS-настройки** домена
2. Добавь (или измени) **A-запись**:
   - **Имя:** `@` (корень домена)
   - **Значение:** IP-адрес сервера Timeweb
3. Если нужен `www`, добавь ещё одну A-запись:
   - **Имя:** `www`
   - **Значение:** тот же IP
4. Подожди 5-30 минут (иногда до 24 часов), пока DNS обновится

Проверить: `ping your-domain.com` — должен показать IP сервера.

### Шаг 3. Подключиться к серверу

Открой терминал (PowerShell, Git Bash, или встроенный в Cursor):

```bash
ssh root@185.104.xx.xx
# Введи пароль root
```

### Шаг 4. Установить Docker и Git

```bash
curl -fsSL https://get.docker.com | sh
apt install git -y
```

### Шаг 5. Клонировать проект

```bash
git clone https://github.com/<username>/wb-cyber-club.git /opt/wb-cyber-club
cd /opt/wb-cyber-club
```

### Шаг 6. Настроить .env

```bash
cp .env.example .env
nano .env
```

Заполни:

```
DOMAIN=your-domain.com
SSL_EMAIL=your@email.com
POSTGRES_USER=cyberclub
POSTGRES_PASSWORD=<придумай надёжный пароль>
POSTGRES_DB=cyberclub
PORT=3000
DATABASE_URL=postgresql://cyberclub:<тот же пароль>@postgres:5432/cyberclub
```

> `DOMAIN` — твой домен (например `cyberclub.ru`)  
> `SSL_EMAIL` — твоя почта (для уведомлений Let's Encrypt)  
> `POSTGRES_PASSWORD` — любой пароль, БД создаётся локально в Docker  
> `DATABASE_URL` — подставь тот же пароль в строку подключения

Сохрани: `Ctrl+O` -> `Enter` -> `Ctrl+X`

### Шаг 7. Запустить

```bash
bash scripts/deploy.sh
```

Скрипт автоматически:
- Соберёт Docker-образ (фронтенд + бэкенд)
- Поднимет PostgreSQL и накатит схему БД
- Запустит Nginx с HTTPS
- Получит SSL-сертификат от Let's Encrypt

### Шаг 8. Готово

Открывай в браузере:
- Сайт: `https://your-domain.com`
- Админка: `https://your-domain.com/admin` (пароль: `admin123`)

---

## Обновление сайта

```bash
ssh root@185.104.xx.xx
cd /opt/wb-cyber-club
bash scripts/deploy.sh
```

Скрипт сам сделает `git pull`, пересоберёт образ и перезапустит контейнеры. Даунтайм — несколько секунд.

---

## Полезные команды (на сервере)

```bash
docker compose logs -f          # логи всех сервисов
docker compose logs -f app      # логи только Express
docker compose ps               # статус контейнеров
docker compose down              # остановить всё
docker compose up -d --build    # пересобрать и запустить
docker compose exec postgres psql -U cyberclub  # зайти в БД
```

---

## Локальная разработка

### Вариант 1: с Docker (рекомендуется)

```bash
# Поднять только PostgreSQL
docker compose up postgres -d

# Настроить .env
cp .env.example .env
# В .env изменить DATABASE_URL на:
# DATABASE_URL=postgresql://cyberclub:cyberclub@localhost:5432/cyberclub

# Установить зависимости
npm install

# Терминал 1 — бэкенд
npm run dev:server   # Express API на http://localhost:3000

# Терминал 2 — фронтенд
npm run dev          # Vite на http://localhost:5173 (proxy на :3000)
```

### Вариант 2: без Docker

Установи PostgreSQL локально, создай базу `cyberclub`, выполни `db/schema.sql`, настрой `.env`.

---

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Vite dev server (фронтенд, порт 5173) |
| `npm run dev:server` | Express сервер (бэкенд, порт 3000) |
| `npm run build` | TypeScript check + Vite build |
| `npm start` | Production: Express раздаёт `dist/` + API |
| `bash scripts/deploy.sh` | Полный деплой (первый запуск или обновление) |
| `bash scripts/init-ssl.sh` | Получение SSL-сертификата |

---

## Архитектура

```
Internet -> Nginx (SSL, gzip, cache)
                |
          Express :3000
          |- /api/*      -> API routes (PostgreSQL)
          |- /*           -> React SPA (dist/)
                |
          PostgreSQL :5432
```

## Структура проекта

```
wb-cyber-club/
|- src/                    # Frontend (FSD)
|  |- app/                 # Роутер, точка входа, глобальные стили
|  |- pages/               # Страницы
|  |- widgets/             # Составные UI-блоки
|  |- features/            # Фичи
|  |- entities/            # Доменные сущности
|  |- shared/              # API, утилиты, хуки, UI
|- server/                 # Backend (Express)
|  |- index.js             # Точка входа
|  |- db.js                # PostgreSQL Pool
|  |- routes/              # API-роутеры
|- nginx/templates/        # Nginx конфиг
|- scripts/                # Скрипты деплоя
|  |- deploy.sh            # Полный деплой
|  |- init-ssl.sh          # Получение SSL
|- db/                     # SQL схема
|- docker-compose.yml      # Production stack
|- Dockerfile              # Multi-stage build
|- .env.example            # Шаблон переменных окружения
```

## API

| Путь | Методы | Описание |
|------|--------|----------|
| `/api/tournaments` | GET, POST, PUT, DELETE | Турниры |
| `/api/teams` | GET, POST, PUT, DELETE | Команды |
| `/api/calendar` | GET, POST, PUT, DELETE | Календарь событий |
| `/api/disciplines` | GET, POST, PUT, DELETE | Дисциплины |
| `/api/links` | GET, POST | Ссылки на регистрацию |
| `/api/regulations` | GET, POST, PUT, DELETE | Регламенты |
| `/api/social` | GET, POST | Социальные ссылки |
| `/api/archive-auto` | GET | Авто-архивирование |

## Админ-панель

Доступна по `/admin`. Пароль: `admin123`.
