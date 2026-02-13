import { memo } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupsIcon from '@mui/icons-material/Groups';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { staggerItem } from '@/shared/lib/animations';
import type { Team } from '@/entities/team/types';

interface Props {
  tournamentTitle: string;
  discipline: string;
  teams: Team[];
  index?: number;
}

export const TeamSection = memo(function TeamSection({
  tournamentTitle,
  discipline,
  teams,
  index = 0,
}: Props) {
  const iconUrl = getDisciplineIconUrl(discipline);

  return (
    <Accordion defaultExpanded sx={{ mb: 1, ...staggerItem(index) }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {iconUrl && (
            <Box component="img" src={iconUrl} alt={discipline} sx={{ width: 24, height: 24, borderRadius: '50%' }} />
          )}
          <Typography fontWeight={600}>{tournamentTitle}</Typography>
          <Chip label={discipline} variant="outlined" />
          <Chip
            icon={<GroupsIcon />}
            label={`${teams.length} команд`}
            color="primary"
            variant="outlined"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {teams.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            Команды ещё не зарегистрировались
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell align="right">Игроков</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell align="right">{team.players}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AccordionDetails>
    </Accordion>
  );
});
