import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useRef, useCallback } from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { disciplineApi } from '@/entities/discipline/api';
import type { Discipline } from '@/entities/discipline/types';

const schema = z.object({
  name: z.string().min(1, 'Введите название'),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  discipline?: Discipline | null;
  onSubmit: (data: FormValues & { id?: number; logo_url?: string | null }) => Promise<void>;
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

  const [logoUrl, setLogoUrl] = useState<string | null>(discipline?.logo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [logoChanged, setLogoChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onDirtyChange?.(isDirty || logoChanged);
  }, [isDirty, logoChanged, onDirtyChange]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await disciplineApi.uploadLogo(file);
      setLogoUrl(url);
      setLogoChanged(true);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const handleRemoveLogo = useCallback(() => {
    if (logoUrl && logoUrl.startsWith('/uploads/')) {
      disciplineApi.deleteLogo(logoUrl).catch(() => {});
    }
    setLogoUrl(null);
    setLogoChanged(true);
  }, [logoUrl]);

  const handleFormSubmit = async (data: FormValues) => {
    await onSubmit({
      ...data,
      id: discipline?.id,
      logo_url: logoChanged ? logoUrl : discipline?.logo_url,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={logoUrl || undefined}
            sx={{
              width: 72,
              height: 72,
              bgcolor: 'action.hover',
              border: '2px dashed',
              borderColor: 'divider',
              fontSize: 28,
            }}
          >
            {!logoUrl && '?'}
          </Avatar>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Логотип дисциплины
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {logoUrl ? 'Заменить' : 'Загрузить'}
              </Button>
              {logoUrl && (
                <IconButton color="error" onClick={handleRemoveLogo} disabled={uploading}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              JPEG, PNG, WebP, SVG — до 2 МБ
            </Typography>
          </Stack>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
            hidden
            onChange={handleFileSelect}
          />
        </Box>

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
          <Button type="submit" variant="contained" disabled={isSubmitting || uploading}>
            Сохранить
          </Button>
        </Box>
      </Stack>
    </form>
  );
}
