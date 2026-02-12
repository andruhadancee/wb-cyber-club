import { useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import { alpha, useTheme } from '@mui/material/styles';

interface LoaderProps {
  text?: string;
}

export function Loader({ text = 'Загрузка...' }: LoaderProps) {
  const theme = useTheme();
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2.5,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress
            size={52}
            thickness={3}
            sx={{
              color: theme.palette.primary.main,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {text}
        </Typography>
      </Box>
    </Fade>
  );
}

/** Хук для управления лоадером */
export function useLoader() {
  const [loading, setLoading] = useState(true);
  const hide = () => setLoading(false);
  return { loading, hide } as const;
}
