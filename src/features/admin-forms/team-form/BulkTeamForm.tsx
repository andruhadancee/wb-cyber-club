import { useState, useEffect, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useTournamentStore } from '@/entities/tournament/model';

interface Props {
  onSubmit: (data: { tournamentId: number; names: string[]; players: number }) => Promise<void>;
  onCancel: () => void;
}

function parseNames(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function BulkTeamForm({ onSubmit, onCancel }: Props) {
  const { activeTournaments, fetchActive } = useTournamentStore();
  const [tournamentId, setTournamentId] = useState<number | ''>('');
  const [rawNames, setRawNames] = useState('');
  const [players, setPlayers] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  const parsed = useMemo(() => parseNames(rawNames), [rawNames]);

  const handleSubmit = async () => {
    if (!tournamentId || parsed.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ tournamentId: Number(tournamentId), names: parsed, players });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Autocomplete
        options={activeTournaments}
        getOptionLabel={(o) => o.title}
        value={activeTournaments.find((t) => t.id === tournamentId) ?? null}
        onChange={(_, v) => setTournamentId(v?.id ?? '')}
        noOptionsText="Ничего не найдено"
        renderInput={(params) => (
          <TextField {...params} label="Турнир" required placeholder="Поиск..." />
        )}
      />

      <TextField
        label="Имена (через запятую, точку с запятой или с новой строки)"
        multiline
        minRows={4}
        maxRows={12}
        value={rawNames}
        onChange={(e) => setRawNames(e.target.value)}
        placeholder={'Игрок1, Игрок2, Игрок3\nИгрок4, Игрок5'}
        required
      />

      {parsed.length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Распознано: {parsed.length}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {parsed.map((name, i) => (
              <Chip key={i} label={name} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      )}

      <TextField
        type="number"
        label="Количество игроков"
        required
        value={players}
        onChange={(e) => setPlayers(Math.max(1, Number(e.target.value)))}
        inputProps={{ min: 1 }}
      />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
        <Button onClick={onCancel}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !tournamentId || parsed.length === 0}
        >
          Добавить {parsed.length > 0 ? `(${parsed.length})` : ''}
        </Button>
      </Box>
    </Stack>
  );
}
