import { useState, useCallback, useRef, useEffect, memo } from 'react';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { parseTournamentDateTime, normalizeTimeToHHmm } from '@/shared/lib/date';
import { pulseGlow } from '@/shared/lib/animations';

interface Props {
  dateStr: string;
  startTime?: string | null;
}

interface Remaining {
  ended: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export const CountdownTimer = memo(function CountdownTimer({ dateStr, startTime }: Props) {
  const theme = useTheme();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const calcRemaining = useCallback((): Remaining | null => {
    if (!startTime) return null;
    const target = parseTournamentDateTime(dateStr, normalizeTimeToHHmm(startTime));
    if (!target) return null;
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    return {
      ended: false,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      totalMs: diff,
    };
  }, [dateStr, startTime]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const tick = () => setRemaining(calcRemaining());

    const setupInterval = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const r = calcRemaining();
      const intervalMs = r && !r.ended && r.totalMs <= ONE_HOUR_MS ? 1000 : 60_000;
      timerRef.current = setInterval(tick, intervalMs);
    };

    setupInterval();

    const checkSwitch = setInterval(() => {
      const r = calcRemaining();
      if (r && !r.ended && r.totalMs <= ONE_HOUR_MS) {
        clearInterval(checkSwitch);
        setupInterval();
      }
    }, 30_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(checkSwitch);
    };
  }, [calcRemaining]);

  if (!remaining) return null;

  if (remaining.ended) {
    return (
      <Chip
        icon={<PlayArrowIcon />}
        label="LIVE"
        color="error"
        sx={{
          fontWeight: 700,
          letterSpacing: '0.05em',
          animation: `${pulseGlow} 2s ease-in-out infinite`,
        }}
      />
    );
  }

  const isUnderHour = remaining.totalMs <= ONE_HOUR_MS;

  let label: string;
  if (isUnderHour) {
    const mm = String(remaining.minutes).padStart(2, '0');
    const ss = String(remaining.seconds).padStart(2, '0');
    label = `${mm}:${ss}`;
  } else {
    const parts: string[] = [];
    if (remaining.days > 0) parts.push(`${remaining.days}д`);
    parts.push(`${remaining.hours}ч`);
    if (remaining.minutes > 0) parts.push(`${remaining.minutes}м`);
    label = parts.join(' ');
  }

  return (
    <Chip
      icon={<AccessTimeIcon />}
      label={label}
      variant="outlined"
      sx={{
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        borderColor: isUnderHour
          ? alpha(theme.palette.warning.main, 0.5)
          : alpha(theme.palette.primary.main, 0.3),
        color: isUnderHour ? 'warning.main' : 'primary.main',
        ...(isUnderHour && {
          animation: `${pulseGlow} 3s ease-in-out infinite`,
        }),
      }}
    />
  );
});
