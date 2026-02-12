import { useEffect, useState, useCallback } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha, useTheme } from '@mui/material/styles';
import { ThemeProvider } from '@/shared/theme';
import { SnackbarProvider } from 'notistack';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog/ConfirmDialog';
import { AdminPanel } from '@/widgets/admin-panel/AdminPanel';
import { Loader } from '@/shared/ui/loader/Loader';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/ru';
import { showError } from '@/shared/lib/toast';
import { pageEntrance } from '@/shared/lib/animations';
import { VideoBackground } from '@/shared/ui/video-background/VideoBackground';

const ADMIN_KEY = 'wbcyber_admin';
const ADMIN_PASSWORD = 'admin123';

function AdminContent() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const isAdmin = localStorage.getItem(ADMIN_KEY) === 'true';
    if (isAdmin) {
      setAuthorized(true);
      setLoading(false);
    } else {
      setShowLogin(true);
      setLoading(false);
    }
  }, []);

  const handleLogin = useCallback(() => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_KEY, 'true');
      setAuthorized(true);
      setShowLogin(false);
    } else {
      showError('Неверный пароль');
      setPassword('');
    }
  }, [password]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(ADMIN_KEY);
    navigate('/');
  }, [navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleLogin();
    },
    [handleLogin],
  );

  if (loading) return <Loader text="Загрузка..." />;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <VideoBackground />
      {/* Login dialog */}
      <Dialog
        open={showLogin}
        onClose={() => navigate('/')}
        PaperProps={{
          sx: {
            minWidth: 360,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            <LockIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Вход в админ-панель
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Введите пароль для продолжения
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            label="Пароль"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{ mt: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => navigate('/')} sx={{ mr: 1 }}>
            Отмена
          </Button>
          <Button onClick={handleLogin} variant="contained" size="large" sx={{ minWidth: 100 }}>
            Войти
          </Button>
        </DialogActions>
      </Dialog>

      {authorized && (
        <>
          <AppBar position="sticky" elevation={0}>
            <Toolbar sx={{ maxWidth: 1920, width: '100%', mx: 'auto' }}>
              <Box
                component={NavLink}
                to="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  mr: 2,
                  transition: 'filter 0.3s ease',
                  '&:hover': {
                    filter: `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.5)})`,
                  },
                }}
              >
                <Box component="img" src="/images/cyberclub-logo.png" alt="WB Cyber Club" sx={{ height: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ flex: 1 }}>
                Админ-панель
              </Typography>
              <Button
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                size="small"
                color="inherit"
                sx={{ color: 'text.secondary' }}
              >
                Выйти
              </Button>
            </Toolbar>
          </AppBar>

          <Container maxWidth="xl" sx={{ flex: 1, py: 3, px: { xs: 2, md: 3, xl: 4 }, ...pageEntrance }}>
            <AdminPanel />
          </Container>
        </>
      )}
    </Box>
  );
}

export function AdminPage() {
  return (
    <ThemeProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <AdminContent />
          <ConfirmDialog />
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
