import { useEffect, useState, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import GroupsIcon from '@mui/icons-material/Groups';
import { useTournamentStore } from '@/entities/tournament/model';
import { useTeamStore } from '@/entities/team/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { TeamSection } from '@/widgets/team-section/TeamSection';
import { Loader } from '@/shared/ui/loader/Loader';
import { pageEntrance } from '@/shared/lib/animations';

export function TeamsPage() {
  const { activeTournaments, fetchActive } = useTournamentStore();
  const { teamsByTournament, fetchAll: fetchTeams } = useTeamStore();
  const { fetchAll: fetchDisciplines } = useDisciplineStore();
  const [selected, setSelected] = useState('all');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([fetchActive(), fetchTeams(), fetchDisciplines()]).finally(() => setReady(true));
  }, [fetchActive, fetchTeams, fetchDisciplines]);

  const activeIds = useMemo(() => new Set(activeTournaments.map((t) => String(t.id))), [activeTournaments]);

  const enriched = useMemo(() => {
    return Object.entries(teamsByTournament)
      .filter(([tid]) => activeIds.has(tid))
      .map(([tid, teams]) => {
        const tournament = activeTournaments.find((t) => String(t.id) === tid)!;
        return {
          tournamentId: tid,
          title: tournament.title,
          discipline: tournament.discipline,
          teams: teams.map((team) => ({
            ...team,
            discipline: team.discipline || tournament.discipline,
            title: team.title || tournament.title,
          })),
        };
      });
  }, [teamsByTournament, activeTournaments, activeIds]);

  const available = [...new Set(enriched.map((e) => e.discipline).filter(Boolean))];
  const filtered =
    selected === 'all' ? enriched : enriched.filter((e) => e.discipline === selected);

  if (!ready) return <Loader />;

  return (
    <Box sx={pageEntrance}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Зарегистрированные команды
      </Typography>
      <DisciplineFilter selected={selected} onSelect={setSelected} availableDisciplines={available} />

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, opacity: 0.7 }}>
          <GroupsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary">
            Команд пока нет
          </Typography>
        </Box>
      ) : (
        filtered.map((entry, i) => (
          <TeamSection
            key={entry.tournamentId}
            tournamentTitle={entry.title}
            discipline={entry.discipline}
            teams={entry.teams}
            index={i}
          />
        ))
      )}
    </Box>
  );
}
