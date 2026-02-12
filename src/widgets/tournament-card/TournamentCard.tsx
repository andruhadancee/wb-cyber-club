import { useScrollAnimation } from '@/features/scroll-animation/useScrollAnimation';
import { CountdownTimer } from '@/features/countdown-timer/CountdownTimer';
import { TournamentButton } from '@/features/tournament-button/TournamentButton';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { formatDateForDisplay } from '@/shared/lib/date';
import type { Tournament } from '@/entities/tournament/types';

interface Props {
  tournament: Tournament;
  regLink: string;
}

export function TournamentCard({ tournament, regLink }: Props) {
  const ref = useScrollAnimation<HTMLDivElement>();
  const iconUrl = getDisciplineIconUrl(tournament.discipline);

  return (
    <div
      ref={ref}
      className="tournament-card"
      data-discipline={tournament.discipline}
      id={`tournament-card-${tournament.id}`}
    >
      <div className="tournament-card-header">
        <h2>{tournament.title}</h2>
      </div>

      <div className="tournament-info">
        <div className="info-item">
          <span className="info-label">Дисциплина</span>
          <span className="info-value">
            <span className="discipline-with-icon">
              {iconUrl ? (
                <img src={iconUrl} className="discipline-icon" alt={tournament.discipline} />
              ) : (
                <span className="discipline-icon discipline-icon-emoji">🎮</span>
              )}
              <span>{tournament.discipline}</span>
            </span>
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Дата</span>
          <span className="info-value">{formatDateForDisplay(tournament.date)}</span>
        </div>
        {tournament.start_time && (
          <div className="info-item">
            <span className="info-label">Время старта</span>
            <span className="info-value">
              {tournament.start_time.split(':').slice(0, 2).join(':')} МСК
            </span>
          </div>
        )}
        <div className="info-item">
          <span className="info-label">Призовой фонд</span>
          <span className="info-value">{tournament.prize}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Команд</span>
          <span className="info-value">
            {tournament.teams || 0} / {tournament.max_teams}
          </span>
        </div>
      </div>

      <CountdownTimer dateStr={tournament.date} startTime={tournament.start_time} />

      <TournamentButton
        date={tournament.date}
        startTime={tournament.start_time}
        regLink={regLink}
        watchUrl={tournament.watch_url}
      />
    </div>
  );
}
