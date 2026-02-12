import { useState, useCallback } from 'react';
import { useInterval } from '@/shared/hooks/useInterval';
import { parseTournamentDateTime } from '@/shared/lib/date';

interface Props {
  dateStr: string;
  startTime?: string | null;
}

export function CountdownTimer({ dateStr, startTime }: Props) {
  const calcRemaining = useCallback(() => {
    if (!startTime) {
      // Без времени старта не показываем таймер
      return null;
    }
    const target = parseTournamentDateTime(dateStr, startTime);
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

  useInterval(() => {
    setRemaining(calcRemaining());
  }, 60000);

  if (!remaining) return null;

  if (remaining.ended) {
    return (
      <div className="timer-container">
        <div className="timer-badge timer-ended">Турнир начался</div>
      </div>
    );
  }

  return (
    <div className="timer-container">
      <div className="timer-badge">
        <span className="timer-label">До начала:</span>
        {remaining.days > 0 && (
          <span className="timer-value">{remaining.days}д</span>
        )}
        <span className="timer-value">{remaining.hours}ч</span>
        {remaining.minutes > 0 && (
          <span className="timer-value">{remaining.minutes}м</span>
        )}
      </div>
    </div>
  );
}
