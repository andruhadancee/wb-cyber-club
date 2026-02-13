import { useState, useCallback, memo } from 'react';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useInterval } from '@/shared/hooks/useInterval';
import { parseTournamentDateTime, normalizeTimeToHHmm } from '@/shared/lib/date';
import { pulseGlow } from '@/shared/lib/animations';

interface Props {
  dateStr: string;
  startTime?: string | null;
}

export const CountdownTimer = memo(function CountdownTimer({ dateStr, startTime }: Props) {
  const theme = useTheme();

  const calcRemaining = useCallback(() => {
    if (!startTime) return null;
    const target = parseTournamentDateTime(dateStr, normalizeTimeToHHmm(startTime));
    if (!target) return null;
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { ended: true, days: 0, hours: 0, minutes: 0 };
    return {
      ended: false,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    };
  }, [dateStr, startTime]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useInterval(() => setRemaining(calcRemaining()), 60000);

  if (!remaining) return null;

  if (remaining.ended) {
    return (
      <Chip
        icon={<PlayArrowIcon />}
        label="LIVE"
        color="success"
        sx={{
          fontWeight: 700,
          letterSpacing: '0.05em',
          animation: `${pulseGlow} 2s ease-in-out infinite`,
        }}
      />
    );
  }

  const parts: string[] = [];
  if (remaining.days > 0) parts.push(`${remaining.days}д`);
  parts.push(`${remaining.hours}ч`);
  if (remaining.minutes > 0) parts.push(`${remaining.minutes}м`);

  return (
    <Chip
      icon={<AccessTimeIcon />}
      label={parts.join(' ')}
      variant="outlined"
      sx={{
        fontWeight: 600,
        borderColor: alpha(theme.palette.primary.main, 0.3),
        color: 'primary.main',
      }}
    />
  );
});
