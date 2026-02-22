import { useState, useCallback, useMemo, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import type { SxProps, Theme } from '@mui/material/styles';

interface Props {
  src: string;
  alt: string;
  size?: number;
  /** Скруглённый квадрат (default) или круг */
  variant?: 'rounded' | 'circular';
  sx?: SxProps<Theme>;
}

export function DisciplineAvatar({ src, alt, size = 24, variant = 'rounded', sx }: Props) {
  const [failed, setFailed] = useState(false);

  const handleError = useCallback((_e: SyntheticEvent<HTMLImageElement>) => {
    setFailed(true);
  }, []);

  const isSvg = useMemo(() => src.toLowerCase().endsWith('.svg'), [src]);
  const radius = variant === 'circular' ? '50%' : `${Math.max(size * 0.2, 4)}px`;

  if (failed) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: radius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          flexShrink: 0,
          ...sx,
        }}
      >
        <SportsEsportsIcon sx={{ fontSize: size * 0.6, color: 'text.disabled' }} />
      </Box>
    );
  }

  if (isSvg) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: radius,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...sx,
        }}
      >
        <Box
          component="img"
          src={src}
          alt={alt}
          onError={handleError}
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={handleError}
      sx={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: 'contain',
        flexShrink: 0,
        ...sx,
      }}
    />
  );
}
