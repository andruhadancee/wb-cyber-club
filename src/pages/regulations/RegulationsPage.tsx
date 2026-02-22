import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useRegulationStore } from '@/entities/regulation/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { Loader } from '@/shared/ui/loader/Loader';
import { pageEntrance, staggerItem } from '@/shared/lib/animations';

export function RegulationsPage() {
  const { regulations, isLoading } = useRegulationStore();
  const { logosMap } = useDisciplineStore();

  if (isLoading) return <Loader />;

  return (
    <Box sx={pageEntrance}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Регламент турниров
      </Typography>

      {regulations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, opacity: 0.7 }}>
          <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary">
            Регламенты пока не добавлены
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
            Регламенты появятся здесь после их добавления администратором
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {regulations.map((reg, i) => {
            const iconUrl = getDisciplineIconUrl(reg.discipline_name, logosMap[String(reg.discipline_id)] ?? logosMap[reg.discipline_name]);
            return (
              <Grid key={reg.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={staggerItem(i)}>
                  <CardActionArea
                    href={reg.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      justifyContent: 'flex-start',
                    }}
                  >
                    {iconUrl ? (
                      <Box
                        component="img"
                        src={iconUrl}
                        alt={reg.discipline_name}
                        sx={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <PictureAsPdfIcon sx={{ fontSize: 56, color: 'error.main', flexShrink: 0 }} />
                    )}
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, flex: 1 }}>
                      <Typography fontWeight={600}>{reg.discipline_name}</Typography>
                      {reg.regulation_name && (
                        <Typography variant="body2" color="text.secondary">
                          {reg.regulation_name}
                        </Typography>
                      )}
                    </CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <Chip label="PDF" color="error" variant="outlined" />
                      <OpenInNewIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.5 }} />
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
