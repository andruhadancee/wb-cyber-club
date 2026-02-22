import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import SaveIcon from '@mui/icons-material/Save';
import { useDisciplineStore } from '@/entities/discipline/model';
import { linksApi, type RegistrationLinks } from '@/shared/api/linksApi';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { DisciplineAvatar } from '@/shared/ui/discipline-avatar/DisciplineAvatar';
import { showSuccess, showError } from '@/shared/lib/toast';

export function LinksForm() {
  const { disciplines, fetchAll } = useDisciplineStore();
  const [links, setLinks] = useState<RegistrationLinks>({});

  useEffect(() => {
    fetchAll();
    linksApi.getAll().then(setLinks);
  }, [fetchAll]);

  const handleChange = (disciplineId: number, value: string) => {
    setLinks((prev) => ({ ...prev, [String(disciplineId)]: value }));
  };

  const handleSave = async () => {
    try {
      await linksApi.save(links);
      showSuccess('Ссылки сохранены!');
    } catch (error) {
      showError('Ошибка сохранения: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Ссылки на формы регистрации
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Укажите ссылки на Google Forms для каждой дисциплины
      </Typography>
      <Stack spacing={2} sx={{ maxWidth: 600 }}>
        {disciplines.map((d) => {
          const iconUrl = getDisciplineIconUrl(d.name, d.logo_url);
          return (
            <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {iconUrl && (
                <DisciplineAvatar src={iconUrl} alt={d.name} />
              )}
              <TextField
                label={d.name}
                value={links[String(d.id)] || ''}
                onChange={(e) => handleChange(d.id, e.target.value)}
                placeholder="https://..."
                fullWidth
              />
            </Box>
          );
        })}
      </Stack>
      <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ mt: 3 }}>
        Сохранить ссылки
      </Button>
    </Box>
  );
}
