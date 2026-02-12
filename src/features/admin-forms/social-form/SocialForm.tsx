import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import SaveIcon from '@mui/icons-material/Save';
import { useSocialLinkStore } from '@/entities/social-link/model';
import { showSuccess, showError } from '@/shared/lib/toast';
import type { SocialLinks } from '@/entities/social-link/types';

export function SocialForm() {
  const { links, fetchAll, save } = useSocialLinkStore();
  const { control, handleSubmit, reset } = useForm<SocialLinks>();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    reset(links);
  }, [links, reset]);

  const onSubmit = async (data: SocialLinks) => {
    try {
      await save(data);
      showSuccess('Социальные ссылки сохранены!');
    } catch (error) {
      showError('Ошибка: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Настройка социальных кнопок
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Укажите ссылки для кнопок в шапке сайта
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2} sx={{ maxWidth: 600 }}>
          <Controller name="twitch" control={control} render={({ field }) => <TextField {...field} label="Twitch" placeholder="https://..." />} />
          <Controller name="telegram" control={control} render={({ field }) => <TextField {...field} label="Telegram" placeholder="https://..." />} />
          <Controller name="discord" control={control} render={({ field }) => <TextField {...field} label="Discord" placeholder="https://..." />} />
          <Controller name="contact" control={control} render={({ field }) => <TextField {...field} label="Связаться с нами" placeholder="https://..." />} />
        </Stack>
        <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ mt: 3 }}>
          Сохранить ссылки
        </Button>
      </form>
    </Box>
  );
}
