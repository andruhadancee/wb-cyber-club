import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Discipline } from '@/entities/discipline/types';

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  discipline?: Discipline | null;
  onSubmit: (data: FormValues & { id?: number }) => Promise<void>;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function DisciplineForm({ discipline, onSubmit, onCancel, onDirtyChange }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: discipline
      ? { name: discipline.name, color: discipline.color || '#8b5abf' }
      : { color: '#8b5abf' },
  });

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({ ...data, id: discipline?.id });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Название дисциплины" required error={!!errors.name} helperText={errors.name?.message} />
          )}
        />

        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Цвет дисциплины
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="color"
                  value={field.value || '#8b5abf'}
                  onChange={field.onChange}
                  style={{ width: 48, height: 36, cursor: 'pointer', border: 'none', borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {field.value}
                </Typography>
              </Box>
            </Box>
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
