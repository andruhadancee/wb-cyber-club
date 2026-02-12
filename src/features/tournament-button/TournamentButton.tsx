import { useState, useCallback } from 'react';
import { useInterval } from '@/shared/hooks/useInterval';
import { parseTournamentDateTime } from '@/shared/lib/date';

interface Props {
  date: string;
  startTime?: string | null;
  regLink: string;
  watchUrl?: string | null;
}

const DEFAULT_WATCH_URL = 'https://www.twitch.tv/wbteamcyberclub';

export function TournamentButton({ date, startTime, regLink, watchUrl }: Props) {
  const getState = useCallback(() => {
    if (!startTime) return 'register' as const;
    const dt = parseTournamentDateTime(date, startTime);
    if (!dt) return 'register' as const;
    return Date.now() >= dt.getTime() ? ('watch' as const) : ('register' as const);
  }, [date, startTime]);

  const [state, setState] = useState(getState);

  useInterval(() => {
    setState(getState());
  }, 60000);

  if (state === 'watch') {
    const finalUrl = (watchUrl && watchUrl.trim()) || DEFAULT_WATCH_URL;
    return (
      <a
        href={finalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-submit"
        style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }}
      >
        Смотреть турнир
      </a>
    );
  }

  if (regLink === '#') {
    return (
      <a
        href="#"
        className="btn-submit"
        onClick={(e) => {
          e.preventDefault();
          alert('Ссылка на регистрацию не настроена в админке');
        }}
      >
        Подать заявку
      </a>
    );
  }

  return (
    <a href={regLink} target="_blank" rel="noopener noreferrer" className="btn-submit">
      Подать заявку
    </a>
  );
}
