import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
import { formatDateForDisplay } from '@/shared/lib/date';
import { staggerItem } from '@/shared/lib/animations';
import type { Tournament } from '@/entities/tournament/types';

interface Props {
  tournament: Tournament;
  regLink: string;
  index?: number;
}

export const TournamentCard = memo(function TournamentCard({ tournament, regLink, index = 0 }: Props) {
  const navigate = useNavigate();
  const iconUrl = getDisciplineIconUrl(tournament.discipline);

  const handleBracketClick = () => {
    navigate(`/tournament/${tournament.id}/bracket`);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...staggerItem(index) }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
        {/* Header: Discipline chip */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Chip
            label={tournament.discipline}
            size="small"
            color="primary"
            variant="outlined"
            avatar={
              iconUrl ? (
                <Box component="img" src={iconUrl} alt={tournament.discipline} sx={{ width: 18, height: 18, borderRadius: '50%' }} />
              ) : undefined
            }
          />
          <CountdownTimer dateStr={tournament.date} startTime={tournament.start_time} />
        </Box>

        {/* Title */}
        <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2, lineHeight: 1.3 }}>
          {tournament.title}
        </Typography>

        <Divider sx={{ mb: 2, opacity: 0.5 }} />

        {/* Info rows */}
        <Stack spacing={1.5} sx={{ flex: 1 }}>
          <InfoRow icon={<CalendarTodayIcon />} label="Дата">
            {formatDateForDisplay(tournament.date)}
            {tournament.start_time && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.8rem' }}>
                {tournament.start_time.split(':').slice(0, 2).join(':')} МСК
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

        {/* Bracket + Registration buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AccountTreeIcon />}
            onClick={handleBracketClick}
            sx={{ textTransform: 'none', flex: 1, fontSize: '0.78rem' }}
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
