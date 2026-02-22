import { useState, useCallback, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import type { SxProps, Theme } from '@mui/material/styles';

interface Props {
  src: string;
  alt: string;
  /** Fixed height or 'auto'. Default 160 */
  height?: number | string;
  /** Object-fit mode. Default 'cover' */
  objectFit?: 'cover' | 'contain' | 'fill';
  /** Border-radius in MUI spacing units. Default 0 */
  borderRadius?: number | string;
  sx?: SxProps<Theme>;
}

export function AppImage({
  src,
  alt,
  height = 180,
  objectFit = 'contain',
  borderRadius = 0,
  sx,
}: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const handleLoad = useCallback(() => setStatus('loaded'), []);
  const handleError = useCallback((_e: SyntheticEvent<HTMLImageElement>) => setStatus('error'), []);

  if (status === 'error') {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          borderRadius,
          ...sx,
        }}
      >
        <BrokenImageIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', borderRadius, overflow: 'hidden', bgcolor: 'rgba(0,0,0,0.3)', ...sx }}>
      {status === 'loading' && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ position: 'absolute', inset: 0, height, borderRadius }}
        />
      )}
      <Box
        component="img"
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        sx={{
          width: '100%',
          height,
          objectFit,
          display: 'block',
          opacity: status === 'loaded' ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </Box>
  );
}
