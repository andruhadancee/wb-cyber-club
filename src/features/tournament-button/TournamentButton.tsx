import { useState, useCallback, memo } from 'react';
import Button from '@mui/material/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { useInterval } from '@/shared/hooks/useInterval';
import { parseTournamentDateTime, normalizeTimeToHHmm } from '@/shared/lib/date';
import { showWarning } from '@/shared/lib/toast';

interface Props {
  date: string;
  startTime?: string | null;
  regLink: string;
  watchUrl?: string | null;
}

const DEFAULT_WATCH_URL = 'https://www.twitch.tv/wbteamcyberclub';

export const TournamentButton = memo(function TournamentButton({
  date,
  startTime,
  regLink,
  watchUrl,
}: Props) {
  const getState = useCallback(() => {
    if (!startTime) return 'register' as const;
    const dt = parseTournamentDateTime(date, normalizeTimeToHHmm(startTime));
    if (!dt) return 'register' as const;
    return Date.now() >= dt.getTime() ? 'watch' : 'register';
  }, [date, startTime]);

  const [state, setState] = useState(getState);
  useInterval(() => setState(getState()), 60000);

  if (state === 'watch') {
    const finalUrl = watchUrl?.trim() || DEFAULT_WATCH_URL;
    return (
      <Button
        variant="contained"
        color="success"
        startIcon={<PlayArrowIcon />}
        href={finalUrl}
        target="_blank"
        rel="noopener noreferrer"
        fullWidth
        sx={{ mt: 2 }}
      >
        Смотреть турнир
      </Button>
    );
  }

  const handleNoLink = () => {
    showWarning('Ссылка на регистрацию не настроена');
  };

  if (regLink === '#') {
    return (
      <Button
        variant="contained"
        color="primary"
        startIcon={<HowToRegIcon />}
        onClick={handleNoLink}
        fullWidth
        sx={{ mt: 2 }}
      >
        Подать заявку
      </Button>
    );
  }

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<HowToRegIcon />}
      href={regLink}
      target="_blank"
      rel="noopener noreferrer"
      fullWidth
      sx={{ mt: 2 }}
    >
      Подать заявку
    </Button>
  );
});
