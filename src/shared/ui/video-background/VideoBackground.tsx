import { memo } from 'react';
import Box from '@mui/material/Box';

const VIDEO_SRC = '/videos/bg.mp4';

/**
 * Fullscreen looped video background with dark overlay.
 * Video compressed to ~330 KB (720p, crf 32).
 */
export const VideoBackground = memo(function VideoBackground() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <Box
        component="video"
        autoPlay
        muted
        loop
        playsInline
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: '100%',
          minHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'cover',
        }}
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </Box>

      {/* Subtle overlay for text readability */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(8, 8, 12, 0.45)',
        }}
      />
    </Box>
  );
});
