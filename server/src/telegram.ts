import { config } from './config';
import logger from './logger';

const BOT_TOKEN = config.TELEGRAM_BOT_TOKEN;
const CHAT_ID = config.TELEGRAM_CHAT_ID;
const MAX_MESSAGE_LENGTH = 4000;
const THROTTLE_MS = 5_000;

let lastSentAt = 0;

function isEnabled(): boolean {
  return !!(BOT_TOKEN && CHAT_ID);
}

export async function sendErrorToTelegram(opts: {
  error: Error;
  url?: string;
  method?: string;
  requestId?: string;
}): Promise<void> {
  if (!isEnabled()) return;

  const now = Date.now();
  if (now - lastSentAt < THROTTLE_MS) return;
  lastSentAt = now;

  const env = process.env.NODE_ENV || 'unknown';
  const stack = opts.error.stack?.slice(0, 1500) || 'no stack';

  let text = `🔴 <b>Server Error</b> [${env}]\n\n`;
  if (opts.method && opts.url) {
    text += `<b>Request:</b> <code>${opts.method} ${opts.url}</code>\n`;
  }
  if (opts.requestId) {
    text += `<b>ReqID:</b> <code>${opts.requestId}</code>\n`;
  }
  text += `<b>Error:</b> <code>${escapeHtml(opts.error.message)}</code>\n\n`;
  text += `<pre>${escapeHtml(stack)}</pre>`;

  if (text.length > MAX_MESSAGE_LENGTH) {
    text = text.slice(0, MAX_MESSAGE_LENGTH) + '\n...truncated';
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    logger.debug({ err }, 'Failed to send Telegram notification');
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
