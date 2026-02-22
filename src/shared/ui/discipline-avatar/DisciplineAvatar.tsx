import { useState, useCallback, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

interface Props {
  src: string;
  alt: string;
  size?: number;
  sx?: SxProps<Theme>;
}

export function DisciplineAvatar({ src, alt, size = 24, sx }: Props) {
  const [failed, setFailed] = useState(false);

  const handleError = useCallback((_e: SyntheticEvent<HTMLImageElement>) => {
    setFailed(true);
  }, []);

  if (failed) return null;

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={handleError}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        ...sx,
      }}
    />
  );
}
