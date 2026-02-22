import { useState, useEffect, useCallback, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { alpha, useTheme } from '@mui/material/styles';
import { useBracketStore } from '@/entities/bracket/model';
import { useTeamStore } from '@/entities/team/model';
import { showSuccess, showError } from '@/shared/lib/toast';
import type { BracketMatch } from '@/entities/bracket/types';

type MatchStatus = 'pending' | 'live' | 'completed';

/** Team option for autocomplete: id + display name */
interface TeamOption {
  id: number;
  name: string;
}

interface MatchEditModalProps {
  match: BracketMatch | null;
  tournamentId: number | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS: { value: MatchStatus; label: string; color: 'default' | 'error' | 'success' }[] = [
  { value: 'pending', label: 'Ожидание', color: 'default' },
  { value: 'live', label: 'LIVE', color: 'error' },
  { value: 'completed', label: 'Завершён', color: 'success' },
];

export function MatchEditModal({ match, tournamentId, onClose, onSaved }: MatchEditModalProps) {
  const theme = useTheme();
  const { updateMatch, matches: allBracketMatches } = useBracketStore();
  const { teamsByTournament } = useTeamStore();

  const [team1, setTeam1] = useState<TeamOption | null>(null);
  const [team2, setTeam2] = useState<TeamOption | null>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [status, setStatus] = useState<MatchStatus>('pending');
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Build options from registered teams
  const teamOptions: TeamOption[] = useMemo(() => {
    if (!tournamentId) return [];
    const teams = teamsByTournament[String(tournamentId)] ?? [];
    return teams.map((t) => ({ id: t.id, name: t.name }));
  }, [tournamentId, teamsByTournament]);

  // Set of team IDs already assigned to OTHER matches in this bracket
  const assignedTeamIds = useMemo(() => {
    const ids = new Set<number>();
    for (const m of allBracketMatches) {
      if (m.id === match?.id) continue;
      if (m.team1_id) ids.add(m.team1_id);
      if (m.team2_id) ids.add(m.team2_id);
    }
    return ids;
  }, [allBracketMatches, match?.id]);

  // Set of team IDs that lost in completed matches (not winner)
  const eliminatedTeamIds = useMemo(() => {
    const ids = new Set<number>();
    const isDouble = allBracketMatches.some((m) => m.bracket_side === 'lower');
    for (const m of allBracketMatches) {
      if (m.status !== 'completed' || !m.winner_id) continue;
      const loserId = m.team1_id === m.winner_id ? m.team2_id : m.team1_id;
      if (!loserId) continue;
      // В double-elimination проигравший в upper bracket ещё не выбыл — он уходит в lower
      if (isDouble && m.bracket_side === 'upper') continue;
      ids.add(loserId);
    }
    return ids;
  }, [allBracketMatches]);

  // Sort: free → assigned → eliminated. Alphabetical within each group.
  const sortByAssignment = useCallback(
    (a: TeamOption, b: TeamOption) => {
      const rank = (t: TeamOption) => {
        if (eliminatedTeamIds.has(t.id)) return 2;
        if (assignedTeamIds.has(t.id)) return 1;
        return 0;
      };
      return rank(a) - rank(b) || a.name.localeCompare(b.name);
    },
    [assignedTeamIds, eliminatedTeamIds],
  );

  const team1Options = useMemo(
    () => teamOptions.filter((t) => t.id !== team2?.id).sort(sortByAssignment),
    [teamOptions, team2, sortByAssignment],
  );
  const team2Options = useMemo(
    () => teamOptions.filter((t) => t.id !== team1?.id).sort(sortByAssignment),
    [teamOptions, team1, sortByAssignment],
  );

  // Sync local state from match prop
  useEffect(() => {
    if (!match) return;

    const t1 = match.team1_id
      ? { id: match.team1_id, name: match.team1_name ?? `Команда #${match.team1_id}` }
      : null;
    const t2 = match.team2_id
      ? { id: match.team2_id, name: match.team2_name ?? `Команда #${match.team2_id}` }
      : null;

    setTeam1(t1);
    setTeam2(t2);
    setScore1(match.score1 ?? 0);
    setScore2(match.score2 ?? 0);
    setStatus(match.status);
    setWinnerId(match.winner_id);
  }, [match]);

  const canEditTeams = status === 'pending';
  const canEditScore = !!team1 && !!team2;

  // Swap teams
  const handleSwap = useCallback(() => {
    const t1 = team1;
    const t2 = team2;
    const s1 = score1;
    const s2 = score2;
    setTeam1(t2);
    setTeam2(t1);
    setScore1(s2);
    setScore2(s1);
    // winnerId stays — it references the team by ID, not by slot
  }, [team1, team2, score1, score2]);

  // Pick winner by ID
  const selectWinner = useCallback(
    (teamId: number | null) => {
      if (!canEditScore) return;
      if (winnerId === teamId) {
        setWinnerId(null);
        if (status === 'completed') setStatus('live');
      } else {
        setWinnerId(teamId);
        setStatus('completed');
      }
    },
    [canEditScore, winnerId, status],
  );

  const handleSave = useCallback(async () => {
    if (!match) return;
    setSaving(true);
    try {
      await updateMatch(match.id, {
        team1Id: team1?.id ?? null,
        team2Id: team2?.id ?? null,
        winnerId,
        score1,
        score2,
        status,
      });
      showSuccess('Матч обновлён');
      onSaved();
    } catch (e) {
      showError('Ошибка: ' + (e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  }, [match, team1, team2, winnerId, score1, score2, status, updateMatch, onSaved]);

  if (!match) return null;

  const accent = theme.palette.primary.main;

  return (
    <Dialog
      open={!!match}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: alpha(theme.palette.background.paper, 0.97),
          backdropFilter: 'blur(16px)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ textAlign: 'center', pb: 1, pt: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Раунд {match.round} · Матч #{match.position + 1}
        </Typography>
        {/* Status chips */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 2 }}>
          {STATUS_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              color={status === opt.value ? opt.color : 'default'}
              variant={status === opt.value ? 'filled' : 'outlined'}
              onClick={() => setStatus(opt.value)}
              sx={{
                fontWeight: status === opt.value ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ '&.MuiDialogContent-root': { pt: 3 }, pb: 2 }}>
        {/* Team selectors + swap */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Autocomplete
            disabled={!canEditTeams}
            options={team1Options}
            value={team1}
            onChange={(_e, val) => setTeam1(val)}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderOption={(props, option) => {
              const isAssigned = assignedTeamIds.has(option.id);
              const isEliminated = eliminatedTeamIds.has(option.id);
              return (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography sx={{
                      fontSize: '0.875rem',
                      opacity: isEliminated ? 0.35 : isAssigned ? 0.5 : 1,
                      textDecoration: isEliminated ? 'line-through' : 'none',
                    }}>
                      {option.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                      {isEliminated && (
                        <Chip label="Выбыла" color="error" variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem', opacity: 0.8 }} />
                      )}
                      {isAssigned && !isEliminated && (
                        <Chip label="В матче"
                          sx={{ height: 20, fontSize: '0.65rem', opacity: 0.7 }} />
                      )}
                    </Box>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Команда 1"
                placeholder={canEditTeams ? 'Выберите команду' : ''}
              />
            )}
            sx={{ flex: 1 }}
          />

          <Tooltip title={canEditTeams ? 'Поменять местами' : 'Нельзя менять в этом статусе'}>
            <span>
              <IconButton
                onClick={handleSwap}
                disabled={!canEditTeams}
                sx={{
                  bgcolor: alpha(accent, 0.08),
                  '&:hover': { bgcolor: alpha(accent, 0.16) },
                  mx: 0.5,
                }}
              >
                <SwapHorizIcon sx={{ color: canEditTeams ? accent : theme.palette.action.disabled }} />
              </IconButton>
            </span>
          </Tooltip>

          <Autocomplete
            disabled={!canEditTeams}
            options={team2Options}
            value={team2}
            onChange={(_e, val) => setTeam2(val)}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderOption={(props, option) => {
              const isAssigned = assignedTeamIds.has(option.id);
              const isEliminated = eliminatedTeamIds.has(option.id);
              return (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography sx={{
                      fontSize: '0.875rem',
                      opacity: isEliminated ? 0.35 : isAssigned ? 0.5 : 1,
                      textDecoration: isEliminated ? 'line-through' : 'none',
                    }}>
                      {option.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                      {isEliminated && (
                        <Chip label="Выбыла" color="error" variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem', opacity: 0.8 }} />
                      )}
                      {isAssigned && !isEliminated && (
                        <Chip label="В матче"
                          sx={{ height: 20, fontSize: '0.65rem', opacity: 0.7 }} />
                      )}
                    </Box>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Команда 2"
                placeholder={canEditTeams ? 'Выберите команду' : ''}
              />
            )}
            sx={{ flex: 1 }}
          />
        </Box>

        {!canEditTeams && (
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            sx={{ mb: 1, fontStyle: 'italic' }}
          >
            Смена команд доступна только в статусе «Ожидание»
          </Typography>
        )}

        <Divider sx={{ my: 2, opacity: 0.15 }} />

        {!canEditScore ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
            Выберите обе команды для редактирования счёта
          </Typography>
        ) : (
          <>
            {/* Scoreboard */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: { xs: 1.5, sm: 3 },
                py: 2.5,
              }}
            >
              <TeamColumn
                name={team1!.name}
                score={score1}
                isWinner={winnerId === team1!.id}
                accent={accent}
                onScoreUp={() => setScore1((s) => s + 1)}
                onScoreDown={() => setScore1((s) => Math.max(0, s - 1))}
                onSelectWinner={() => selectWinner(team1!.id)}
              />

              <Box sx={{ textAlign: 'center', px: 1 }}>
                <Typography
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: alpha(theme.palette.text.secondary, 0.3),
                    letterSpacing: 2,
                  }}
                >
                  VS
                </Typography>
              </Box>

              <TeamColumn
                name={team2!.name}
                score={score2}
                isWinner={winnerId === team2!.id}
                accent={accent}
                onScoreUp={() => setScore2((s) => s + 1)}
                onScoreDown={() => setScore2((s) => Math.max(0, s - 1))}
                onSelectWinner={() => selectWinner(team2!.id)}
              />
            </Box>

            <Divider sx={{ my: 2.5, opacity: 0.15 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              display="block"
              sx={{ pb: 0.5 }}
            >
              {winnerId
                ? 'Победитель будет продвинут в следующий раунд'
                : 'Нажмите на команду, чтобы выбрать победителя'}
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pt: 1, pb: 3, justifyContent: 'center', gap: 1.5 }}>
        <Button onClick={onClose} sx={{ minWidth: 100 }}>
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ minWidth: 130 }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ═══════════ TeamColumn ═══════════ */

function TeamColumn({
  name,
  score,
  isWinner,
  accent,
  onScoreUp,
  onScoreDown,
  onSelectWinner,
}: {
  name: string;
  score: number;
  isWinner: boolean;
  accent: string;
  onScoreUp: () => void;
  onScoreDown: () => void;
  onSelectWinner: () => void;
}) {
  const theme = useTheme();

  return (
    <Box
      onClick={onSelectWinner}
      sx={{
        flex: 1,
        maxWidth: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        p: 2,
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.25s',
        border: `2px solid ${isWinner ? accent : 'transparent'}`,
        bgcolor: isWinner ? alpha(accent, 0.08) : alpha(theme.palette.divider, 0.04),
        '&:hover': {
          bgcolor: alpha(accent, 0.06),
          border: `2px solid ${alpha(accent, 0.4)}`,
        },
      }}
    >
      {isWinner && <EmojiEventsIcon sx={{ color: accent, fontSize: 22 }} />}

      <Typography
        noWrap
        title={name}
        sx={{
          fontWeight: isWinner ? 800 : 600,
          fontSize: '0.9rem',
          textAlign: 'center',
          maxWidth: '100%',
          color: isWinner ? accent : 'text.primary',
        }}
      >
        {name}
      </Typography>

      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          onClick={onScoreDown}
          disabled={score <= 0}
          sx={{
            width: 32,
            height: 32,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          }}
        >
          <RemoveIcon sx={{ fontSize: 16 }} />
        </IconButton>

        <Box
          sx={{
            minWidth: 48,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            bgcolor: isWinner ? accent : alpha(theme.palette.divider, 0.1),
            color: isWinner ? '#fff' : 'text.primary',
          }}
        >
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1 }}>
            {score}
          </Typography>
        </Box>

        <IconButton
          onClick={onScoreUp}
          sx={{
            width: 32,
            height: 32,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
