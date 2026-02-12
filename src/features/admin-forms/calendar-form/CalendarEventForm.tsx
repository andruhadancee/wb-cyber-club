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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useDisciplineStore } from '@/entities/discipline/model';
import type { CalendarEvent } from '@/entities/calendar-event/types';

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  eventDate: z.string().min(1, 'Укажите дату'),
  discipline: z.string().optional(),
  startTime: z.string().optional(),
  prize: z.string().optional(),
  maxTeams: z.coerce.number().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  registrationLink: z.string().optional(),
  customLink: z.string().optional(),
  watchUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  event?: CalendarEvent | null;
  defaultDate?: string;
  onSubmit: (data: FormValues & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

export function CalendarEventForm({ event, defaultDate, onSubmit, onCancel }: Props) {
  const { disciplines, fetchAll } = useDisciplineStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: event
      ? {
          title: event.title,
          eventDate: (event.event_date || '').slice(0, 10),
          discipline: event.discipline || '',
          startTime: event.start_time || '',
          prize: event.prize || '',
          maxTeams: event.max_teams || undefined,
          description: event.description || '',
          imageUrl: event.image_url || '',
          registrationLink: event.registration_link || '',
          customLink: event.custom_link || '',
          watchUrl: event.watch_url || '',
        }
      : { eventDate: defaultDate || '' },
  });

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, id: event?.id });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Название" required error={!!errors.title} helperText={errors.title?.message} />
          )}
        />

        <Controller
          name="discipline"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Дисциплина">
              <MenuItem value="">Без дисциплины</MenuItem>
              {disciplines.map((d) => (
                <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
              ))}
            </TextField>
          )}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="eventDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Дата"
                value={field.value ? dayjs(field.value) : null}
                onChange={(val: Dayjs | null) => field.onChange(val ? val.format('YYYY-MM-DD') : '')}
                slotProps={{
                  textField: {
                    required: true,
                    error: !!errors.eventDate,
                    helperText: errors.eventDate?.message,
                    fullWidth: true,
                  },
                }}
              />
            )}
          />
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
                  textField: { fullWidth: true },
                }}
              />
            )}
          />
        </Box>

        <Controller
          name="prize"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Призовой фонд" placeholder="100 000 ₽" />
          )}
        />

        <Controller
          name="maxTeams"
          control={control}
          render={({ field }) => (
            <TextField {...field} type="number" label="Количество команд" inputProps={{ min: 2 }} />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Описание" multiline rows={3} />
          )}
        />

        <Controller
          name="imageUrl"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="URL изображения" placeholder="https://..." />
          )}
        />

        <Controller
          name="registrationLink"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Ссылка на регистрацию" placeholder="https://forms.gle/..." />
          )}
        />

        <Controller
          name="customLink"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Пользовательская ссылка" placeholder="https://..." />
          )}
        />

        <Controller
          name="watchUrl"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Ссылка на трансляцию" placeholder="https://twitch.tv/..." />
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
