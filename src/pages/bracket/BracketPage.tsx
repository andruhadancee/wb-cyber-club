import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useBracketStore } from '@/entities/bracket/model';
import { useTournamentStore } from '@/entities/tournament/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { BracketView } from '@/shared/ui/bracket/BracketView';
import { Loader } from '@/shared/ui/loader/Loader';
import { pageEntrance } from '@/shared/lib/animations';

export function BracketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tournamentId = Number(id);

  const { matches, isLoading, fetchByTournament } = useBracketStore();
  const { activeTournaments, pastTournaments, fetchActive, fetchPast } = useTournamentStore();
  const { colorsMap, fetchAll: fetchDisciplines } = useDisciplineStore();

  const tournament =
    activeTournaments.find((t) => t.id === tournamentId) ??
    pastTournaments.find((t) => t.id === tournamentId);

  useEffect(() => {
    fetchByTournament(tournamentId);
    if (activeTournaments.length === 0) fetchActive();
    if (pastTournaments.length === 0) fetchPast();
    fetchDisciplines();
  }, [tournamentId, fetchByTournament, fetchActive, fetchPast, fetchDisciplines, activeTournaments.length, pastTournaments.length]);

  const accentColor = tournament ? (colorsMap[tournament.discipline] ?? undefined) : undefined;

  if (isLoading) return <Loader text="Загрузка сетки..." />;

  return (
    <Box sx={pageEntrance}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: 'none' }}
        >
          Назад
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={800} gutterBottom>
        {tournament ? `${tournament.title} — Сетка` : 'Турнирная сетка'}
      </Typography>

      {tournament && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {tournament.discipline} &middot; {tournament.date}
          {tournament.prize && ` · ${tournament.prize}`}
        </Typography>
      )}

      <BracketView matches={matches} accentColor={accentColor ?? undefined} />
    </Box>
  );
}
