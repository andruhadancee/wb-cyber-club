import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useDisciplineStore } from '@/entities/discipline/model';
import type { Regulation } from '@/entities/regulation/types';

const schema = z.object({
  disciplineId: z.coerce.number().min(1, 'Выберите дисциплину'),
  regulation_name: z.string().optional(),
  pdf_url: z.string().url('Введите корректный URL').min(1, 'Обязательное поле'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  regulation?: Regulation | null;
  onSubmit: (data: FormValues & { id?: number }) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function RegulationForm({ regulation, onSubmit, onCancel, onDirtyChange }: Props) {
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
    defaultValues: regulation
      ? {
          disciplineId: regulation.discipline_id,
          regulation_name: regulation.regulation_name || '',
          pdf_url: regulation.pdf_url,
        }
      : undefined,
  });

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, id: regulation?.id });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <Controller
          name="disciplineId"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={disciplines}
              getOptionLabel={(o) => o.name}
              value={disciplines.find((d) => d.id === field.value) ?? null}
              onChange={(_, v) => field.onChange(v?.id ?? 0)}
              noOptionsText="Ничего не найдено"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Дисциплина"
                  required
                  error={!!errors.disciplineId}
                  helperText={errors.disciplineId?.message}
                  placeholder="Поиск..."
                />
              )}
            />
          )}
        />
        <Controller
          name="regulation_name"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Название регламента" placeholder="Регламент сезона 2025" helperText="Необязательно" />
          )}
        />
        <Controller
          name="pdf_url"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Ссылка на PDF" required placeholder="https://example.com/regulation.pdf" error={!!errors.pdf_url} helperText={errors.pdf_url?.message} />
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
