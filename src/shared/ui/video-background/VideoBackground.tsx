import { memo, useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';

const VIDEO_SRC = '/videos/bg.mp4';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

/**
 * Fullscreen looped video background with dark overlay.
 * - CSS gradient fallback always visible behind the video
 * - Graceful error handling with retry logic
 * - Fade-in transition when video is ready to play
 */
export const VideoBackground = memo(function VideoBackground() {
  const [ready, setReady] = useState(false);
  const retriesRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleCanPlay = useCallback(() => {
    setReady(true);
  }, []);

  const handleError = useCallback(() => {
    if (retriesRef.current >= MAX_RETRIES) return;

    retriesRef.current += 1;
    const video = videoRef.current;
    if (!video) return;

    setTimeout(() => {
      video.src = `${VIDEO_SRC}?retry=${retriesRef.current}`;
      video.load();
    }, RETRY_DELAY);
  }, []);

  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (el) {
        el.addEventListener('canplay', handleCanPlay, { once: true });
        el.addEventListener('error', handleError);
      }
    },
    [handleCanPlay, handleError],
  );

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
        /* Gradient fallback — always visible behind video */
        background:
          'radial-gradient(ellipse at 20% 50%, rgba(88, 28, 135, 0.15), transparent 60%), ' +
          'radial-gradient(ellipse at 80% 20%, rgba(59, 7, 100, 0.12), transparent 50%), ' +
          'linear-gradient(160deg, #08080c 0%, #0d0d14 50%, #08080c 100%)',
      }}
    >
      <Box
        component="video"
        ref={setVideoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        src={VIDEO_SRC}
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
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
        }}
      />

      {/* Dark overlay for text readability */}
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
