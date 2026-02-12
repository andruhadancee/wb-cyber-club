import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTournamentStore } from '@/entities/tournament/model';
import { useTeamStore } from '@/entities/team/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { TeamSection } from '@/widgets/team-section/TeamSection';

export function TeamsPage() {
  const { hideLoader } = useOutletContext<{ hideLoader: () => void }>();
  const { activeTournaments, fetchActive } = useTournamentStore();
  const { teamsByTournament, fetchAll: fetchTeams } = useTeamStore();
  const { fetchAll: fetchDisciplines } = useDisciplineStore();
  const [selected, setSelected] = useState('all');

  useEffect(() => {
    Promise.all([fetchActive(), fetchTeams(), fetchDisciplines()]).finally(hideLoader);
  }, [fetchActive, fetchTeams, fetchDisciplines, hideLoader]);

  // Enrich teams with tournament data
  const enriched = useMemo(() => {
    return Object.entries(teamsByTournament).map(([tid, teams]) => {
      const tournament = activeTournaments.find((t) => String(t.id) === tid);
      return {
        tournamentId: tid,
        title: tournament?.title || teams[0]?.title || `Турнир #${tid}`,
        discipline: tournament?.discipline || teams[0]?.discipline || '',
        teams: teams.map((team) => ({
          ...team,
          discipline: team.discipline || tournament?.discipline,
          title: team.title || tournament?.title,
        })),
      };
    });
  }, [teamsByTournament, activeTournaments]);

  const available = [...new Set(enriched.map((e) => e.discipline).filter(Boolean))];
  const filtered = selected === 'all'
    ? enriched
    : enriched.filter((e) => e.discipline === selected);

  return (
    <>
      <DisciplineFilter
        selected={selected}
        onSelect={setSelected}
        availableDisciplines={available}
      />
      <div id="teams-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>Команд по выбранной дисциплине нет</h3>
          </div>
        ) : (
          filtered.map((entry) => (
            <TeamSection
              key={entry.tournamentId}
              tournamentTitle={entry.title}
              discipline={entry.discipline}
              teams={entry.teams}
            />
          ))
        )}
      </div>
    </>
  );
}
