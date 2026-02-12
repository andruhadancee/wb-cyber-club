import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import type { Team } from '@/entities/team/types';

interface Props {
  tournamentTitle: string;
  discipline: string;
  teams: Team[];
}

export function TeamSection({ tournamentTitle, discipline, teams }: Props) {
  const iconUrl = getDisciplineIconUrl(discipline);

  return (
    <div className="tournament-section">
      <h2>
        <span className="tournament-discipline-line">
          <span className="tournament-header-icon">
            {iconUrl ? (
              <img src={iconUrl} className="discipline-icon" alt={discipline} />
            ) : (
              <span className="discipline-icon discipline-icon-emoji">🎮</span>
            )}
          </span>
          <span className="tournament-header-discipline">{discipline}</span>
        </span>
        <span className="tournament-title-line">{tournamentTitle}</span>
      </h2>
      <div className="teams-list">
        {teams.length > 0 ? (
          teams.map((team) => (
            <div key={team.id} className="team-card">
              <div className="team-name">{team.name}</div>
              <div className="team-info">
                <span>👥 {team.players} игроков</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>Команды ещё не зарегистрировались</p>
          </div>
        )}
      </div>
    </div>
  );
}
