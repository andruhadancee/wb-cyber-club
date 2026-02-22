import { Component, type ErrorInfo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            px: 3,
            bgcolor: '#09090b',
            color: '#fafafa',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 64, color: '#ef4444', mb: 2, opacity: 0.7 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Что-то пошло не так
          </Typography>
          <Typography variant="body2" color="#a1a1aa" sx={{ maxWidth: 420, mb: 3 }}>
            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
          </Typography>

          {this.state.error && (
            <Box
              sx={{
                mb: 3,
                px: 2,
                py: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                maxWidth: 500,
                overflow: 'auto',
              }}
            >
              <Typography
                variant="caption"
                component="pre"
                sx={{ fontFamily: 'monospace', color: '#ef4444', whiteSpace: 'pre-wrap', m: 0 }}
              >
                {this.state.error.message}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
              sx={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' },
              }}
            >
              Перезагрузить
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={this.handleHome}
              sx={{ borderColor: 'rgba(255,255,255,0.15)', color: '#a1a1aa' }}
            >
              На главную
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
