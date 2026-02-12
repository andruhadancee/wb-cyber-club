import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { useTournamentStore } from '@/entities/tournament/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { linksApi, type RegistrationLinks } from '@/shared/api/linksApi';
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { TournamentCard } from '@/widgets/tournament-card/TournamentCard';
import { Loader } from '@/shared/ui/loader/Loader';
import { pageEntrance } from '@/shared/lib/animations';

export function TournamentsPage() {
  const { activeTournaments, fetchActive, isLoading } = useTournamentStore();
  const { fetchAll: fetchDisciplines } = useDisciplineStore();
  const [selected, setSelected] = useState('all');
  const [links, setLinks] = useState<RegistrationLinks>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([fetchActive(), fetchDisciplines(), linksApi.getAll().then(setLinks)]).finally(() =>
      setReady(true),
    );
  }, [fetchActive, fetchDisciplines]);

  const available = [...new Set(activeTournaments.map((t) => t.discipline))];
  const filtered =
    selected === 'all'
      ? activeTournaments
      : activeTournaments.filter((t) => t.discipline === selected);

  const getRegLink = (t: (typeof activeTournaments)[0]) => {
    if (t.custom_link?.trim()) return t.custom_link.trim();
    if (links[t.discipline]) return links[t.discipline];
    return '#';
  };

  if (!ready || isLoading) return <Loader />;

  return (
    <Box sx={pageEntrance}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Активные турниры
      </Typography>
      <DisciplineFilter selected={selected} onSelect={setSelected} availableDisciplines={available} />

      {filtered.length === 0 ? (
        <EmptyState
          title={selected === 'all' ? 'Активных турниров пока нет' : 'Турниров по этой дисциплине нет'}
          subtitle={selected === 'all' ? 'Следите за обновлениями в наших социальных сетях' : undefined}
        />
      ) : (
        <Grid container spacing={3}>
          {filtered.map((t, i) => (
            <Grid key={t.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <TournamentCard tournament={t} regLink={getRegLink(t)} index={i} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10, opacity: 0.7 }}>
      <SportsEsportsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
      <Typography variant="h6" color="text.secondary">
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
