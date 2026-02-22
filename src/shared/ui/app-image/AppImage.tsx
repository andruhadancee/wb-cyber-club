import { useState, useCallback, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import type { SxProps, Theme } from '@mui/material/styles';

interface Props {
  src: string;
  alt: string;
  /** Max height limit for very tall images. Default 280 */
  maxHeight?: number | string;
  /** Min height for skeleton placeholder. Default 120 */
  minHeight?: number | string;
  /** Border-radius in MUI spacing units. Default 0 */
  borderRadius?: number | string;
  sx?: SxProps<Theme>;
}

export function AppImage({
  src,
  alt,
  maxHeight = 280,
  minHeight = 120,
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
          height: minHeight,
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
    <Box sx={{ position: 'relative', borderRadius, overflow: 'hidden', ...sx }}>
      {status === 'loading' && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ width: '100%', height: minHeight, borderRadius }}
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
          height: 'auto',
          maxHeight,
          objectFit: 'cover',
          display: status === 'loading' ? 'none' : 'block',
          opacity: status === 'loaded' ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </Box>
  );
}
