import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { AppImage } from '@/shared/ui/app-image/AppImage';
import { DisciplineAvatar } from '@/shared/ui/discipline-avatar/DisciplineAvatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { CountdownTimer } from '@/features/countdown-timer/CountdownTimer';
import { TournamentButton } from '@/features/tournament-button/TournamentButton';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { getDisciplineColor } from '@/shared/lib/discipline-colors';
import { formatDateForDisplay, normalizeTimeToHHmm } from '@/shared/lib/date';
import { staggerItem } from '@/shared/lib/animations';
import { alpha } from '@mui/material/styles';
import type { Tournament } from '@/entities/tournament/types';

interface Props {
  tournament: Tournament;
  regLink: string;
  logoUrl?: string | null;
  index?: number;
}

export const TournamentCard = memo(function TournamentCard({ tournament, regLink, logoUrl, index = 0 }: Props) {
  const navigate = useNavigate();
  const iconUrl = getDisciplineIconUrl(tournament.discipline, logoUrl ?? tournament.discipline_logo_url);
  const discColor = getDisciplineColor(tournament.discipline, tournament.discipline_color);

  const handleBracketClick = () => {
    navigate(`/tournament/${tournament.id}/bracket`);
  };

  const imageUrl = tournament.image_url?.trim() || null;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...staggerItem(index) }}>
      {imageUrl && (
        <AppImage src={imageUrl} alt={tournament.title} />
      )}
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Chip
            label={tournament.discipline}
            variant="outlined"
            avatar={
              iconUrl ? (
                <DisciplineAvatar src={iconUrl} alt={tournament.discipline} />
              ) : undefined
            }
            sx={{
              borderColor: alpha(discColor, 0.4),
              color: discColor,
              fontWeight: 600,
              '& .MuiChip-label': { color: discColor },
            }}
          />
          <CountdownTimer dateStr={tournament.date} startTime={tournament.start_time} />
        </Box>

        <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2, lineHeight: 1.3 }}>
          {tournament.title}
        </Typography>

        <Divider sx={{ mb: 2, opacity: 0.5 }} />

        <Stack spacing={1.5} sx={{ flex: 1 }}>
          <InfoRow icon={<CalendarTodayIcon />} label="Дата">
            {formatDateForDisplay(tournament.date)}
            {tournament.start_time && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.8rem' }}>
                {normalizeTimeToHHmm(tournament.start_time)} МСК
              </Typography>
            )}
          </InfoRow>
          <InfoRow icon={<EmojiEventsIcon />} label="Призовой фонд">
            <Typography component="span" sx={{ fontWeight: 700, color: 'warning.main' }}>
              {tournament.prize}
            </Typography>
          </InfoRow>
          <InfoRow icon={<GroupsIcon />} label="Команд">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography component="span" fontWeight={600}>
                {tournament.teams || 0}
              </Typography>
              <Typography component="span" color="text.secondary" fontSize="0.85rem">
                / {tournament.max_teams}
              </Typography>
            </Box>
          </InfoRow>
        </Stack>

        <Box sx={{ mt: 2, mb: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AccountTreeIcon />}
            onClick={handleBracketClick}
            fullWidth
            sx={{ textTransform: 'none', fontSize: '0.78rem' }}
          >
            Сетка
          </Button>
        </Box>

        <TournamentButton
          date={tournament.date}
          startTime={tournament.start_time}
          regLink={regLink}
          watchUrl={tournament.watch_url}
        />
      </CardContent>
    </Card>
  );
});

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ color: 'primary.main', display: 'flex', opacity: 0.7, '& svg': { fontSize: 18 } }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 75, fontSize: '0.82rem' }}>
        {label}
      </Typography>
      <Box sx={{ fontSize: '0.88rem' }}>{children}</Box>
    </Box>
  );
}
