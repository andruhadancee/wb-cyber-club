import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { Header } from '@/widgets/header/Header';
import { VideoBackground } from '@/shared/ui/video-background/VideoBackground';

export function AppLayout() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <VideoBackground/>
      <Header />
      <Container
        maxWidth="lg"
        component="main"
        sx={{ flex: 1, py: 4, px: { xs: 2, md: 3 } }}
      >
        <Outlet />
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3,
          textAlign: 'center',
          borderTop: `1px solid ${theme.palette.divider}`,
          mt: 'auto',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          WB Cyber Club &copy; {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}
