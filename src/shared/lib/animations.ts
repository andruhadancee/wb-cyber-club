import { keyframes } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

/** Fade-in from bottom */
export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/** Fade-in  */
export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/** Subtle pulse glow */
export const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
  50% { box-shadow: 0 0 20px 4px rgba(124, 58, 237, 0.15); }
`;

/** Stagger animation sx helper */
export function staggerItem(index: number, baseDelay = 0.05): SxProps<Theme> {
  return {
    animation: `${fadeInUp} 0.5s ease-out both`,
    animationDelay: `${index * baseDelay}s`,
  };
}

/** Page entrance animation */
export const pageEntrance: SxProps<Theme> = {
  animation: `${fadeInUp} 0.4s ease-out`,
};
