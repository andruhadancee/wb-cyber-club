#!/bin/bash
# ─────────────────────────────────────────────
#  Деплой WB Cyber Club
#  Работает как для первого запуска, так и для обновлений
# ─────────────────────────────────────────────
set -e

echo "=============================="
echo "  WB Cyber Club — Deploy"
echo "=============================="

# ── Проверяем Docker ──
if ! command -v docker &> /dev/null; then
  echo ""
  echo "Docker не найден. Устанавливаю..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "Docker установлен. Перезайдите в сессию (exit && ssh ...) и запустите скрипт снова."
  exit 0
fi

# ── Проверяем .env ──
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo ""
    echo ".env не найден. Копирую из .env.example..."
    cp .env.example .env
    echo ""
    echo "ВАЖНО: Отредактируйте .env перед запуском!"
    echo "  nano .env"
    echo ""
    echo "Обязательные поля:"
    echo "  DOMAIN=your-domain.com"
    echo "  SSL_EMAIL=your@email.com"
    echo "  POSTGRES_PASSWORD=<надёжный пароль>"
    echo ""
    exit 1
  else
    echo "ERROR: .env и .env.example не найдены"
    exit 1
  fi
fi

source .env

# ── Валидация ──
ERRORS=0
if [ -z "$DOMAIN" ]; then
  echo "ERROR: DOMAIN не задан в .env"
  ERRORS=1
fi
if [ -z "$POSTGRES_PASSWORD" ]; then
  echo "WARNING: POSTGRES_PASSWORD не задан, используется дефолтный (небезопасно!)"
fi
if [ $ERRORS -eq 1 ]; then
  exit 1
fi

# ── Pull обновлений (если git) ──
if [ -d .git ]; then
  echo ""
  echo "==> Git pull..."
  git pull --ff-only || echo "WARNING: git pull не удался, продолжаем с текущим кодом"
fi

# ── Сборка и запуск ──
echo ""
echo "==> Сборка и запуск контейнеров..."
docker compose up -d --build

# ── SSL (первый запуск) ──
CERT_DIR="./certbot/conf/live/$DOMAIN"
if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ -f "$CERT_DIR/is_dummy" ]; then
  echo ""
  echo "==> SSL-сертификат не найден. Запускаю init-ssl.sh..."
  bash scripts/init-ssl.sh
fi

echo ""
echo "=============================="
echo "  Деплой завершён!"
echo "=============================="
echo ""
echo "  https://$DOMAIN"
echo ""
echo "  Полезные команды:"
echo "    docker compose logs -f        — логи"
echo "    docker compose ps             — статус"
echo "    docker compose down            — остановить"
echo "    docker compose up -d --build  — пересобрать"
echo ""
