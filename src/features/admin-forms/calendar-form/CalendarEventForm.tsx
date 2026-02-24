import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useCallback } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useDisciplineStore } from '@/entities/discipline/model';
import { ImageUpload } from '@/shared/ui/image-upload/ImageUpload';
import type { CalendarEvent } from '@/entities/calendar-event/types';
import { normalizeTimeToHHmm } from '@/shared/lib/date';

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  eventDate: z.string().min(1, 'Укажите дату'),
  disciplineId: z.coerce.number().optional(),
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
  onDirtyChange?: (dirty: boolean) => void;
}

export function CalendarEventForm({ event, defaultDate, onSubmit, onCancel, onDirtyChange }: Props) {
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
    defaultValues: event
      ? {
          title: event.title,
          eventDate: (event.event_date || '').slice(0, 10),
          disciplineId: event.discipline_id || undefined,
          startTime: normalizeTimeToHHmm(event.start_time),
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

  const [imageUrl, setImageUrl] = useState<string | null>(event?.image_url || null);
  const [imageChanged, setImageChanged] = useState(false);

  const handleImageChange = useCallback((url: string | null) => {
    setImageUrl(url);
    setImageChanged(true);
  }, []);

  useEffect(() => { onDirtyChange?.(isDirty || imageChanged); }, [isDirty, imageChanged, onDirtyChange]);

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({
      ...data,
      imageUrl: imageChanged ? (imageUrl || '') : data.imageUrl,
      id: event?.id,
    });
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
          name="disciplineId"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={disciplines}
              getOptionLabel={(o) => o.name}
              value={disciplines.find((d) => d.id === field.value) ?? null}
              onChange={(_, v) => field.onChange(v?.id ?? undefined)}
              noOptionsText="Ничего не найдено"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Дисциплина"
                  placeholder={disciplines.length === 0 ? 'Сначала создайте дисциплину' : 'Поиск...'}
                />
              )}
            />
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

        <ImageUpload
          value={imageUrl}
          onChange={handleImageChange}
          label="Изображение события"
          hint="JPEG, PNG, WebP — до 2 МБ"
        />

        <Controller
          name="registrationLink"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Ссылка на регистрацию" placeholder="https://forms.gle/..." />
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
