import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useTournamentStore } from '@/entities/tournament/model';
import type { Team } from '@/entities/team/types';

const schema = z.object({
  tournamentId: z.coerce.number().min(1, 'Выберите турнир'),
  name: z.string().min(1, 'Введите название'),
  players: z.coerce.number().min(1, 'Минимум 1 игрок'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  team?: Team | null;
  onSubmit: (data: FormValues & { id?: number }) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function TeamForm({ team, onSubmit, onCancel, onDirtyChange }: Props) {
  const { activeTournaments, fetchActive } = useTournamentStore();

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: team
      ? { tournamentId: team.tournament_id, name: team.name, players: team.players }
      : { players: 5 },
  });

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, id: team?.id });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <Controller
          name="tournamentId"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Турнир" required error={!!errors.tournamentId} helperText={errors.tournamentId?.message}>
              <MenuItem value="">Выберите турнир</MenuItem>
              {activeTournaments.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Название команды" required error={!!errors.name} helperText={errors.name?.message} placeholder="Team Spirit" />
          )}
        />
        <Controller
          name="players"
          control={control}
          render={({ field }) => (
            <TextField {...field} type="number" label="Количество игроков" required inputProps={{ min: 1 }} error={!!errors.players} helperText={errors.players?.message} />
          )}
        />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
          <Button onClick={onCancel}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Сохранить
          </Button>
        </Box>
      </Stack>
    </form>
  );
}
