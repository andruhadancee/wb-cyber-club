import { useEffect, useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useTournamentStore } from '@/entities/tournament/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { formatDateForDisplay, parseTournamentDate } from '@/shared/lib/date';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { Loader } from '@/shared/ui/loader/Loader';
import { pageEntrance, staggerItem } from '@/shared/lib/animations';
import type { Tournament } from '@/entities/tournament/types';

export function ArchivePage() {
  const { pastTournaments, fetchPast, isLoading } = useTournamentStore();
  const { fetchAll: fetchDisciplines } = useDisciplineStore();
  const [selected, setSelected] = useState('all');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([fetchPast(), fetchDisciplines()]).finally(() => setReady(true));
  }, [fetchPast, fetchDisciplines]);

  const sorted = useMemo(() => {
    let list = [...pastTournaments];
    if (selected !== 'all') list = list.filter((t) => t.discipline === selected);
    return list.sort((a, b) => {
      const da = parseTournamentDate(a.date);
      const db = parseTournamentDate(b.date);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    });
  }, [pastTournaments, selected]);

  const available = [...new Set(pastTournaments.map((t) => t.discipline))];

  if (!ready || isLoading) return <Loader />;

  return (
    <Box sx={pageEntrance}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Архив турниров
      </Typography>
      <DisciplineFilter selected={selected} onSelect={setSelected} availableDisciplines={available} />

      {sorted.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, opacity: 0.7 }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary">
            {selected === 'all' ? 'Прошедших турниров пока нет' : 'Турниров по этой дисциплине нет'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {sorted.map((t, i) => (
            <Grid key={t.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ArchiveCard tournament={t} index={i} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

const ArchiveCard = memo(function ArchiveCard({ tournament, index = 0 }: { tournament: Tournament; index?: number }) {
  const navigate = useNavigate();
  const watchUrl = tournament.watch_url?.trim() || null;
  const imageUrl = tournament.image_url?.trim() || null;
  const iconUrl = getDisciplineIconUrl(tournament.discipline);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...staggerItem(index) }}>
      {imageUrl && (
        <CardMedia
          component="img"
          image={imageUrl}
          alt={tournament.title}
          sx={{ height: 160, objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
        <Chip
          label={tournament.discipline}
          size="small"
          variant="outlined"
          avatar={
            iconUrl ? (
              <Box component="img" src={iconUrl} alt={tournament.discipline} sx={{ width: 18, height: 18, borderRadius: '50%' }} />
            ) : undefined
          }
          sx={{ alignSelf: 'flex-start', mb: 1.5 }}
        />

        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, lineHeight: 1.3 }}>
          {tournament.title}
        </Typography>

        <Divider sx={{ mb: 1.5, opacity: 0.5 }} />

        <Stack spacing={0.75} sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {formatDateForDisplay(tournament.date)}
          </Typography>
          <Typography variant="body2">
            Призовой фонд:{' '}
            <Typography component="span" fontWeight={700} color="warning.main">
              {tournament.prize}
            </Typography>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Команд: {tournament.teams || 0}
          </Typography>
        </Stack>

        {tournament.winner && (
          <Chip
            icon={<EmojiEventsIcon />}
            label={tournament.winner}
            color="warning"
            size="small"
            sx={{ alignSelf: 'flex-start', mt: 1.5, fontWeight: 600 }}
          />
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<AccountTreeIcon />}
            onClick={() => navigate(`/tournament/${tournament.id}/bracket`)}
            size="small"
            sx={{ textTransform: 'none', fontSize: '0.78rem' }}
          >
            Сетка
          </Button>
          {watchUrl && (
            <Button
              variant="outlined"
              startIcon={<PlayArrowIcon />}
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
            >
              Смотреть
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});
