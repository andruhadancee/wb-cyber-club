import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Header } from '@/widgets/header/Header';
import { VideoBackground } from '@/shared/ui/video-background/VideoBackground';

export function AppLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <VideoBackground/>
      <Header />
      <Container
        maxWidth="xl"
        component="main"
        sx={{ flex: 1, py: 4, px: { xs: 2, md: 3, xl: 4 } }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}
