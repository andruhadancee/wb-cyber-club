#!/bin/bash
# ─────────────────────────────────────────────
#  Получение SSL-сертификата Let's Encrypt
#  Запускать ОДИН РАЗ при первом деплое
# ─────────────────────────────────────────────
set -e

# Загружаем переменные
if [ ! -f .env ]; then
  echo "ERROR: .env файл не найден. Скопируйте .env.example в .env и заполните."
  exit 1
fi
source .env

if [ -z "$DOMAIN" ]; then
  echo "ERROR: DOMAIN не задан в .env"
  exit 1
fi

if [ -z "$SSL_EMAIL" ]; then
  echo "ERROR: SSL_EMAIL не задан в .env (нужен для Let's Encrypt)"
  exit 1
fi

echo "==> Домен: $DOMAIN"
echo "==> Email: $SSL_EMAIL"

CERT_DIR="./certbot/conf/live/$DOMAIN"

# Если сертификат уже есть — пропускаем
if [ -f "$CERT_DIR/fullchain.pem" ] && [ ! -f "$CERT_DIR/is_dummy" ]; then
  echo "SSL-сертификат уже существует. Пропускаем."
  echo "Для перевыпуска удалите папку certbot/conf и запустите скрипт снова."
  exit 0
fi

# 1. Создаём временный самоподписанный сертификат (чтобы nginx стартовал)
echo "==> Создаём временный сертификат..."
mkdir -p "$CERT_DIR"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/CN=$DOMAIN" 2>/dev/null
touch "$CERT_DIR/is_dummy"

# 2. Стартуем nginx (с временным сертификатом)
echo "==> Запускаем nginx..."
docker compose up -d nginx
sleep 3

# 3. Удаляем временный сертификат
echo "==> Удаляем временный сертификат..."
rm -rf "$CERT_DIR"

# 4. Получаем настоящий сертификат от Let's Encrypt
echo "==> Запрашиваем сертификат у Let's Encrypt..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$SSL_EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# 5. Перезагружаем nginx с настоящим сертификатом
echo "==> Перезагружаем nginx..."
docker compose exec nginx nginx -s reload

echo ""
echo "==> SSL-сертификат успешно установлен!"
echo "==> Сайт доступен: https://$DOMAIN"
echo ""
echo "Автообновление сертификата уже настроено через certbot-сервис в docker-compose."
