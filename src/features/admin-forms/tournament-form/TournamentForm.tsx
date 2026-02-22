import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useDisciplineStore } from '@/entities/discipline/model';
import type { Tournament } from '@/entities/tournament/types';
import { normalizeTimeToHHmm } from '@/shared/lib/date';

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  disciplineId: z.coerce.number().min(1, 'Выберите дисциплину'),
  date: z.string().min(1, 'Укажите дату'),
  prize: z.string().min(1, 'Укажите призовой фонд'),
  maxTeams: z.coerce.number().min(2, 'Минимум 2').optional(),
  teams: z.coerce.number().min(0).optional(),
  customLink: z.string().optional(),
  startTime: z.string().optional(),
  watchUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  winner: z.string().optional(),
  winner2nd: z.string().optional(),
  winner3rd: z.string().optional(),
  status: z.enum(['active', 'finished']),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  tournament?: Tournament | null;
  isPast?: boolean;
  onSubmit: (data: FormValues & { id?: number }) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

function parseDate(dateStr: string): string {
  const m = dateStr.match(/(\d+)\s+(\w+)\s+(\d+)/);
  if (m) {
    const months: Record<string, string> = {
      января: '01', февраля: '02', марта: '03', апреля: '04',
      мая: '05', июня: '06', июля: '07', августа: '08',
      сентября: '09', октября: '10', ноября: '11', декабря: '12',
    };
    return `${m[3]}-${months[m[2]] || '01'}-${m[1].padStart(2, '0')}`;
  }
  return dateStr;
}

export function TournamentForm({ tournament, isPast = false, onSubmit, onCancel, onDirtyChange }: Props) {
  const { disciplines, fetchAll } = useDisciplineStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: tournament
      ? {
          title: tournament.title,
          disciplineId: tournament.discipline_id,
          date: parseDate(tournament.date),
          prize: tournament.prize,
          maxTeams: tournament.max_teams,
          teams: tournament.teams || 0,
          customLink: tournament.custom_link || '',
          startTime: normalizeTimeToHHmm(tournament.start_time),
          watchUrl: tournament.watch_url || '',
          imageUrl: tournament.image_url || '',
          winner: tournament.winner || '',
          winner2nd: tournament.winner_2nd || '',
          winner3rd: tournament.winner_3rd || '',
          status: isPast ? 'finished' : 'active',
        }
      : {
          status: isPast ? 'finished' : 'active',
          maxTeams: 16,
          teams: 0,
          title: '',
          disciplineId: 0,
          date: '',
          prize: '',
          customLink: '',
          startTime: '',
          watchUrl: '',
          imageUrl: '',
          winner: '',
          winner2nd: '',
          winner3rd: '',
        },
  });

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, id: tournament?.id });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Название турнира" required error={!!errors.title} helperText={errors.title?.message} />
          )}
        />

        <Controller
          name="disciplineId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value || ''}
              onChange={(e) => field.onChange(Number(e.target.value))}
              select
              label="Дисциплина"
              required
              error={!!errors.disciplineId}
              helperText={errors.disciplineId?.message}
            >
              <MenuItem value="">Выберите</MenuItem>
              {disciplines.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </TextField>
          )}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Дата"
                value={field.value ? dayjs(field.value) : null}
                onChange={(val: Dayjs | null) => field.onChange(val ? val.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    required: true,
                    error: !!errors.date,
                    helperText: errors.date?.message,
                    fullWidth: true,
                  },
                }}
              />
            )}
          />
          {!isPast && (
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <TimePicker
                  label="Время начала (МСК)"
                  ampm={false}
                  value={field.value ? dayjs(`2000-01-01T${field.value}`) : null}
                  onChange={(val: Dayjs | null) => field.onChange(val ? val.format('HH:mm') : '')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'Московское время',
                    },
                  }}
                />
              )}
            />
          )}
        </Box>

        <Controller
          name="prize"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Призовой фонд" required placeholder="25 000 ₽" error={!!errors.prize} helperText={errors.prize?.message} />
          )}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isPast && (
            <Controller
              name="maxTeams"
              control={control}
              render={({ field }) => (
                <TextField {...field} type="number" label="Максимум команд" inputProps={{ min: 2 }} sx={{ flex: 1 }} />
              )}
            />
          )}
          {isPast && (
            <Controller
              name="teams"
              control={control}
              render={({ field }) => (
                <TextField {...field} type="number" label="Участвовало команд" inputProps={{ min: 0 }} helperText="Фактическое количество" sx={{ flex: 1 }} />
              )}
            />
          )}
        </Box>

        {!isPast && (
          <Controller
            name="customLink"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Ссылка на регистрацию" placeholder="https://forms.gle/..." helperText="Если пусто, будет из настроек" />
            )}
          />
        )}

        <Controller
          name="watchUrl"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Ссылка на трансляцию" placeholder="https://twitch.tv/..." helperText="Кнопка появится в момент старта" />
          )}
        />

        <Controller
          name="imageUrl"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="URL изображения" placeholder="https://..." helperText="Для карточки в архиве" />
          )}
        />

        {isPast && (
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Призовые места
            </Typography>
            <Controller
              name="winner"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="1-е место"
                  placeholder="Название команды"
                  autoComplete="off"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontSize: '1.1rem' }}>🥇</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
            <Controller
              name="winner2nd"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="2-е место"
                  placeholder="Название команды"
                  autoComplete="off"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontSize: '1.1rem' }}>🥈</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
            <Controller
              name="winner3rd"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="3-е место"
                  placeholder="Название команды"
                  autoComplete="off"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontSize: '1.1rem' }}>🥉</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Stack>
        )}

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
