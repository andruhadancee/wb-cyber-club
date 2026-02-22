import { useState, useMemo, memo } from 'react';
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
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { formatDateForDisplay } from '@/shared/lib/date';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { getDisciplineColor } from '@/shared/lib/discipline-colors';
import { alpha } from '@mui/material/styles';
import { Loader } from '@/shared/ui/loader/Loader';
import { pageEntrance, staggerItem } from '@/shared/lib/animations';
import type { Tournament } from '@/entities/tournament/types';

export function ArchivePage() {
  const { pastTournaments, isLoading } = useTournamentStore();
  const [selected, setSelected] = useState('all');

  const sorted = useMemo(() => {
    if (selected === 'all') return pastTournaments;
    return pastTournaments.filter((t) => t.discipline === selected);
  }, [pastTournaments, selected]);

  const available = [...new Set(pastTournaments.map((t) => t.discipline))];

  if (isLoading) return <Loader />;

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
  const iconUrl = getDisciplineIconUrl(tournament.discipline, tournament.discipline_logo_url);
  const discColor = getDisciplineColor(tournament.discipline, tournament.discipline_color);

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
          variant="outlined"
          avatar={
            iconUrl ? (
              <Box component="img" src={iconUrl} alt={tournament.discipline} sx={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
            ) : undefined
          }
          sx={{
            alignSelf: 'flex-start',
            mb: 1.5,
            borderColor: alpha(discColor, 0.4),
            color: discColor,
            fontWeight: 600,
            '& .MuiChip-label': { color: discColor },
          }}
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

        {(tournament.winner || tournament.winner_2nd || tournament.winner_3rd) && (
          <Stack spacing={0.75} sx={{ mt: 1.5 }}>
            {tournament.winner && (
              <Chip
                icon={<EmojiEventsIcon />}
                label={tournament.winner}
                sx={{ alignSelf: 'flex-start', fontWeight: 600, bgcolor: alpha('#fbbf24', 0.15), color: '#fbbf24', border: `1px solid ${alpha('#fbbf24', 0.3)}` }}
              />
            )}
            {tournament.winner_2nd && (
              <Chip
                label={`2-е: ${tournament.winner_2nd}`}
                variant="outlined"
                sx={{ alignSelf: 'flex-start', fontWeight: 600, borderColor: alpha('#a0a0a0', 0.4), color: '#a0a0a0' }}
              />
            )}
            {tournament.winner_3rd && (
              <Chip
                label={`3-е: ${tournament.winner_3rd}`}
                variant="outlined"
                sx={{ alignSelf: 'flex-start', fontWeight: 600, borderColor: alpha('#cd7f32', 0.4), color: '#cd7f32' }}
              />
            )}
          </Stack>
        )}

        {(tournament.has_bracket || watchUrl) && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {tournament.has_bracket && (
              <Button
                variant="outlined"
                startIcon={<AccountTreeIcon />}
                onClick={() => navigate(`/tournament/${tournament.id}/bracket`)}
                sx={{ textTransform: 'none', fontSize: '0.78rem' }}
              >
                Сетка
              </Button>
            )}
            {watchUrl && (
              <Button
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Смотреть
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
});
