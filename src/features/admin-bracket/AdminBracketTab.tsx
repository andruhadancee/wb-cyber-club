import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteIcon from '@mui/icons-material/Delete';
import { alpha, useTheme } from '@mui/material/styles';
import { useBracketStore } from '@/entities/bracket/model';
import { useTeamStore } from '@/entities/team/model';
import { BracketView } from '@/shared/ui/bracket/BracketView';
import { MatchEditModal } from './MatchEditModal';
import { showSuccess, showError } from '@/shared/lib/toast';
import { showConfirm } from '@/shared/ui/confirm-dialog/ConfirmDialog';
import type { Tournament } from '@/entities/tournament/types';
import type { BracketMatch, BracketFormat } from '@/entities/bracket/types';

interface AdminBracketTabProps {
  tournaments: Tournament[];
}

export function AdminBracketTab({ tournaments }: AdminBracketTabProps) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [editMatch, setEditMatch] = useState<BracketMatch | null>(null);
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);

  const { matches, isLoading, hasBracket, fetchByTournament, generate, deleteBracket } = useBracketStore();
  const { fetchAll: fetchTeams } = useTeamStore();

  const selectedTournament = tournaments.find((t) => t.id === selectedId);
  const accentColor = selectedTournament?.discipline_color ?? undefined;

  const handleSelectTournament = useCallback(
    (tournamentId: number) => {
      setSelectedId(tournamentId);
      fetchByTournament(tournamentId);
      fetchTeams();
    },
    [fetchByTournament, fetchTeams],
  );

  // Open format dialog instead of generating directly
  const handleGenerateClick = useCallback(() => {
    if (!selectedId) return;
    if (hasBracket) {
      showConfirm({
        message: 'Сетка уже существует. Перегенерировать? Текущая сетка будет удалена.',
        confirmLabel: 'Перегенерировать',
        onConfirm: () => setFormatDialogOpen(true),
      });
    } else {
      setFormatDialogOpen(true);
    }
  }, [selectedId, hasBracket]);

  const handleFormatSelect = useCallback(
    async (format: BracketFormat) => {
      if (!selectedId) return;
      setFormatDialogOpen(false);
      try {
        await generate(selectedId, format);
        showSuccess('Сетка сгенерирована');
      } catch (e) {
        showError('Ошибка: ' + (e instanceof Error ? e.message : e));
      }
    },
    [selectedId, generate],
  );

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    showConfirm({
      message: 'Удалить сетку? Это действие нельзя отменить.',
      onConfirm: async () => {
        try {
          await deleteBracket(selectedId);
          showSuccess('Сетка удалена');
        } catch (e) {
          showError('Ошибка: ' + (e instanceof Error ? e.message : e));
        }
      },
    });
  }, [selectedId, deleteBracket]);

  const handleMatchClick = useCallback((match: BracketMatch) => {
    setEditMatch(match);
  }, []);

  const handleMatchSaved = useCallback(() => {
    setEditMatch(null);
    if (selectedId) fetchByTournament(selectedId);
  }, [selectedId, fetchByTournament]);

  const accent = accentColor ?? theme.palette.primary.main;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 3, flexWrap: 'wrap' }}>
        <Autocomplete
          sx={{ minWidth: 300 }}
          options={tournaments}
          getOptionLabel={(o) => `${o.title} (${o.discipline})`}
          value={tournaments.find((t) => t.id === selectedId) ?? null}
          onChange={(_, v) => handleSelectTournament(v?.id ?? 0)}
          noOptionsText="Ничего не найдено"
          renderInput={(params) => (
            <TextField {...params} label="Выберите турнир" placeholder="Поиск..." />
          )}
        />

        {selectedId && !(selectedTournament?.status === 'finished' && !hasBracket) && (
          <>
            <Button
              variant="contained"
              startIcon={<AutoFixHighIcon />}
              onClick={handleGenerateClick}
              disabled={isLoading}
            >
              {hasBracket ? 'Перегенерировать' : 'Сгенерировать сетку'}
            </Button>
            {hasBracket && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                disabled={isLoading}
              >
                Удалить сетку
              </Button>
            )}
          </>
        )}
      </Box>

      {/* Content */}
      {!selectedId && (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Выберите турнир для управления сеткой
        </Typography>
      )}

      {selectedId && isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {selectedId && !isLoading && (
        <>
          {selectedTournament?.status === 'finished' && !hasBracket && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              У архивного турнира нет сетки. Сетка доступна только для турниров с зарегистрированными командами.
            </Alert>
          )}
          {hasBracket && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Нажмите на матч, чтобы установить счёт и победителя. Победитель автоматически продвигается дальше.
            </Alert>
          )}
          <BracketView
            matches={matches}
            accentColor={accentColor ?? undefined}
            onMatchClick={handleMatchClick}
          />
        </>
      )}

      {/* Match edit modal */}
      <MatchEditModal
        match={editMatch}
        tournamentId={selectedId || null}
        onClose={() => setEditMatch(null)}
        onSaved={handleMatchSaved}
      />

      {/* Format selection dialog */}
      <Dialog
        open={formatDialogOpen}
        onClose={() => setFormatDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          Выберите формат сетки
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <FormatOption
              title="На вылет"
              subtitle="Классический турнир на вылет. Одно поражение — выбываешь."
              accent={accent}
              onClick={() => handleFormatSelect('single')}
            />
            <FormatOption
              title="Двойное выбывание"
              subtitle="Две сетки: верхняя и нижняя. Проигравшие получают второй шанс в нижней сетке."
              accent={accent}
              onClick={() => handleFormatSelect('double')}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2.5 }}>
          <Button onClick={() => setFormatDialogOpen(false)}>Отмена</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function FormatOption({
  title,
  subtitle,
  accent,
  onClick,
}: {
  title: string;
  subtitle: string;
  accent: string;
  onClick: () => void;
}) {
  const theme = useTheme();
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        border: `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: accent,
          bgcolor: alpha(accent, 0.06),
          boxShadow: `0 0 12px ${alpha(accent, 0.15)}`,
        },
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
        {subtitle}
      </Typography>
    </Box>
  );
}
