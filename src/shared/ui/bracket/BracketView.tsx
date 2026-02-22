import { memo, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import { alpha, useTheme } from '@mui/material/styles';
import type { BracketMatch, BracketSide } from '@shared/api/bracket';

/* ═══════════════════ Constants ═══════════════════ */

const MATCH_W = 280;
const MATCH_H = 80;
const GAP_V = 32;
const CONNECTOR_W = 56;
const HEADER_H = 44;
const PAD = 48;
const CELL_H = MATCH_H + GAP_V;
const SECTION_GAP = 60; // vertical gap between UB and LB

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.12;
const DRAG_THRESHOLD = 4;

/* ═══════════════════ Types ═══════════════════ */

interface RoundData {
  round: number;
  label: string;
  matches: BracketMatch[];
}

interface BracketViewProps {
  matches: BracketMatch[];
  accentColor?: string;
  onMatchClick?: (match: BracketMatch) => void;
}

interface BracketLayout {
  isDouble: boolean;
  upper: RoundData[];
  lower: RoundData[];
  grandFinal: BracketMatch | null;
  // Computed dimensions
  ubH: number;
  lbH: number;
  ubMaxMatches: number;
  lbMaxMatches: number;
  contentW: number;
  contentH: number;
}

/* ═══════════════════ Helpers ═══════════════════ */

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

function groupRounds(matches: BracketMatch[], side: BracketSide, prefix: string): RoundData[] {
  const filtered = matches.filter((m) => m.bracket_side === side);
  const map = new Map<number, BracketMatch[]>();
  for (const m of filtered) {
    const arr = map.get(m.round) ?? [];
    arr.push(m);
    map.set(m.round, arr);
  }
  const total = map.size;
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, ms]) => ({
      round,
      label: sideRoundLabel(round, total, prefix),
      matches: ms.sort((a, b) => a.position - b.position),
    }));
}

function sideRoundLabel(r: number, total: number, _prefix: string): string {
  if (_prefix === 'GF') return 'Гранд-финал';
  if (r === total) return 'Финал';
  if (r === total - 1 && total > 2) return 'Полуфинал';
  if (r === total - 2 && total > 3) return '1/4';
  return `Раунд ${r}`;
}

function computeLayout(matches: BracketMatch[]): BracketLayout {
  const hasLower = matches.some((m) => m.bracket_side === 'lower');
  const isDouble = hasLower;

  const upper = groupRounds(matches, 'upper', isDouble ? 'ВС' : '');
  const lower = isDouble ? groupRounds(matches, 'lower', 'НС') : [];
  const grandFinal = matches.find((m) => m.bracket_side === 'grand_final') ?? null;

  const ubMaxMatches = upper.reduce((mx, r) => Math.max(mx, r.matches.length), 0);
  const lbMaxMatches = lower.reduce((mx, r) => Math.max(mx, r.matches.length), 0);
  const ubH = ubMaxMatches * CELL_H;
  const lbH = lbMaxMatches * CELL_H;

  const maxRounds = Math.max(upper.length, lower.length) + (grandFinal ? 1 : 0);
  const contentW = maxRounds * MATCH_W + (maxRounds - 1) * CONNECTOR_W + PAD * 2;
  const contentH = ubH + (isDouble ? SECTION_GAP + HEADER_H + lbH : 0) + HEADER_H + PAD * 2 + (grandFinal ? CELL_H : 0);

  return { isDouble, upper, lower, grandFinal, ubH, lbH, ubMaxMatches, lbMaxMatches, contentW, contentH };
}

/** Team initials for avatar */
function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ═══════════════════ MatchCard ═══════════════════ */

const MatchCard = memo(function MatchCard({
  match, accent, onClick,
}: {
  match: BracketMatch; accent: string; onClick?: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const hasWinner = !!match.winner_id;
  const hasTeams = !!match.team1_name || !!match.team2_name;
  const isBye = hasTeams && (!match.team1_name || !match.team2_name);

  // ── backgrounds per state ──
  const cardBg = isCompleted && hasWinner
    ? isDark
      ? `linear-gradient(145deg, ${alpha('#141e2a', 0.95)} 0%, ${alpha('#0f1620', 0.97)} 100%)`
      : `linear-gradient(145deg, ${alpha('#f6faf7', 0.97)} 0%, ${alpha('#eef5f0', 0.98)} 100%)`
    : isLive
      ? isDark
        ? `linear-gradient(145deg, ${alpha('#2a1520', 0.94)} 0%, ${alpha('#1a0e15', 0.97)} 100%)`
        : `linear-gradient(145deg, ${alpha('#fff8f8', 0.97)} 0%, ${alpha('#fef2f2', 0.98)} 100%)`
      : isDark
        ? `linear-gradient(145deg, ${alpha('#1a1d2e', 0.92)} 0%, ${alpha('#12141f', 0.96)} 100%)`
        : `linear-gradient(145deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#f5f6fa', 0.98)} 100%)`;

  const borderColor = isLive
    ? theme.palette.error.main
    : isCompleted && hasWinner
      ? alpha(theme.palette.success.main, isDark ? 0.4 : 0.45)
      : alpha(theme.palette.divider, isDark ? 0.12 : 0.15);

  const shadowLayers = isLive
    ? `0 0 20px ${alpha(theme.palette.error.main, 0.3)}, 0 4px 16px ${alpha('#000', 0.3)}`
    : isCompleted && hasWinner
      ? `0 0 12px ${alpha(theme.palette.success.main, isDark ? 0.15 : 0.1)}, 0 4px 16px ${alpha('#000', isDark ? 0.25 : 0.08)}`
      : `0 4px 20px ${alpha('#000', isDark ? 0.25 : 0.06)}`;

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: MATCH_W, height: MATCH_H, position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        border: `1.5px solid ${borderColor}`, borderRadius: '12px', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
        background: cardBg, backdropFilter: 'blur(16px)', boxShadow: shadowLayers,
        opacity: isBye ? 0.4 : !hasTeams ? 0.35 : 1,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        ...(onClick && {
          '&:hover': {
            borderColor: accent,
            boxShadow: `0 0 20px ${alpha(accent, 0.2)}, 0 6px 24px ${alpha('#000', 0.2)}`,
            transform: 'translateY(-1px)',
          },
        }),
        ...(isLive && {
          animation: 'bracketPulse 2.5s ease-in-out infinite',
          '@keyframes bracketPulse': {
            '0%,100%': { boxShadow: `0 0 16px ${alpha(theme.palette.error.main, 0.2)}, 0 4px 16px ${alpha('#000', 0.3)}` },
            '50%': { boxShadow: `0 0 28px ${alpha(theme.palette.error.main, 0.4)}, 0 4px 16px ${alpha('#000', 0.3)}` },
          },
        }),
      }}
    >
      {/* Top accent line */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: isLive ? '2.5px' : '2px',
        background: isLive
          ? `linear-gradient(90deg, transparent 0%, ${theme.palette.error.main} 20%, ${alpha('#ff6b6b', 0.9)} 50%, ${theme.palette.error.main} 80%, transparent 100%)`
          : isCompleted && hasWinner
            ? `linear-gradient(90deg, transparent, ${theme.palette.success.main}, ${alpha(theme.palette.success.light, 0.7)}, transparent)`
            : `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, isDark ? 0.1 : 0.15)}, transparent)`,
        ...(isLive && {
          backgroundSize: '200% 100%',
          animation: 'shimmerLine 2s linear infinite',
          '@keyframes shimmerLine': {
            '0%': { backgroundPosition: '200% 0' },
            '100%': { backgroundPosition: '-200% 0' },
          },
        }),
      }} />
      <StatusBadge status={match.status} hasWinner={hasWinner} />
      <TeamSlot name={match.team1_name} score={match.score1}
        isWinner={hasWinner && match.winner_id === match.team1_id}
        isLoser={hasWinner && match.team1_id !== null && match.winner_id !== match.team1_id}
        accent={accent} isCompleted={isCompleted} />
      <Box sx={{
        height: '1px', mx: 1.5,
        background: isCompleted && hasWinner
          ? `linear-gradient(90deg, transparent, ${alpha(theme.palette.success.main, isDark ? 0.18 : 0.2)}, transparent)`
          : `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, isDark ? 0.1 : 0.15)}, transparent)`,
      }} />
      <TeamSlot name={match.team2_name} score={match.score2}
        isWinner={hasWinner && match.winner_id === match.team2_id}
        isLoser={hasWinner && match.team2_id !== null && match.winner_id !== match.team2_id}
        accent={accent} isCompleted={isCompleted} />
    </Paper>
  );
});

/* ═══════════════════ StatusBadge ═══════════════════ */

function StatusBadge({ status }: { status: string; hasWinner: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isLive = status === 'live';
  const isCompleted = status === 'completed';

  // Completed — no badge, conveyed by green accent & winner highlight
  if (isCompleted) return null;

  if (isLive) {
    return (
      <Box sx={{
        position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 0.4,
        px: 0.7, py: 0.15, borderRadius: '5px', zIndex: 2,
        bgcolor: alpha(theme.palette.error.main, 0.95),
        boxShadow: `0 0 8px ${alpha(theme.palette.error.main, 0.4)}`,
        animation: 'badgePulse 2s ease-in-out infinite',
        '@keyframes badgePulse': {
          '0%,100%': { boxShadow: `0 0 6px ${alpha(theme.palette.error.main, 0.4)}` },
          '50%': { boxShadow: `0 0 14px ${alpha(theme.palette.error.main, 0.6)}` },
        },
      }}>
        <Box sx={{ position: 'relative', width: 6, height: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{
            position: 'absolute', width: 6, height: 6, borderRadius: '50%', bgcolor: '#fff',
            animation: 'liveRing 1.5s ease-out infinite',
            '@keyframes liveRing': {
              '0%': { transform: 'scale(1)', opacity: 0.7 },
              '100%': { transform: 'scale(2.5)', opacity: 0 },
            },
          }} />
          <Box sx={{
            width: 4, height: 4, borderRadius: '50%', bgcolor: '#fff', position: 'relative', zIndex: 1,
          }} />
        </Box>
        <Typography sx={{
          fontSize: '0.45rem', fontWeight: 800, letterSpacing: 0.6, lineHeight: 1.2, color: '#fff',
        }}>
          LIVE
        </Typography>
      </Box>
    );
  }

  // Pending
  return (
    <Box sx={{
      position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 0.3,
      px: 0.6, py: 0.15, borderRadius: '5px', zIndex: 2,
      bgcolor: alpha(isDark ? '#475569' : '#94a3b8', 0.25),
      border: `1px solid ${alpha(isDark ? '#64748b' : '#94a3b8', 0.2)}`,
    }}>
      <Typography sx={{
        fontSize: '0.4rem', fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.2,
        color: alpha(isDark ? '#94a3b8' : '#64748b', 0.7),
        textTransform: 'uppercase',
      }}>
        Ожидание
      </Typography>
    </Box>
  );
}

/* ═══════════════════ TeamSlot ═══════════════════ */

function TeamSlot({
  name, score, isWinner, isLoser, accent, isCompleted,
}: {
  name: string | null; score: number | null; isWinner: boolean; isLoser: boolean; accent: string; isCompleted: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hasBye = !name;
  const green = theme.palette.success.main;

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', height: (MATCH_H - 1) / 2, px: 1.2, gap: 0.8,
      position: 'relative', transition: 'opacity 0.2s',
      opacity: isLoser ? 0.45 : 1,
      ...(isWinner && {
        background: `linear-gradient(90deg, ${alpha(green, isDark ? 0.1 : 0.07)} 0%, transparent 70%)`,
      }),
    }}>
      {/* Left accent bar for winner */}
      {isWinner && (
        <Box sx={{
          position: 'absolute', left: 0, top: '15%', bottom: '15%', width: '3px',
          borderRadius: '0 3px 3px 0',
          background: `linear-gradient(180deg, ${green}, ${alpha(green, 0.6)})`,
          boxShadow: `0 0 6px ${alpha(green, 0.4)}`,
        }} />
      )}
      <Box sx={{
        width: 24, height: 24, borderRadius: '6px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.55rem', fontWeight: 800, letterSpacing: 0.5, transition: 'all 0.25s',
        color: isWinner ? '#fff' : hasBye ? alpha(theme.palette.text.disabled, 0.5) : isDark ? alpha('#fff', 0.6) : alpha('#000', 0.5),
        bgcolor: isWinner ? green : alpha(theme.palette.divider, isDark ? 0.12 : 0.1),
        border: isWinner ? `1.5px solid ${alpha(green, 0.7)}` : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        ...(isWinner && { boxShadow: `0 0 8px ${alpha(green, 0.3)}` }),
      }}>
        {getInitials(name)}
      </Box>
      <Typography noWrap title={name ?? undefined} sx={{
        flex: 1, fontSize: '0.78rem',
        fontWeight: isWinner ? 700 : 500,
        color: hasBye
          ? alpha(theme.palette.text.disabled, 0.6)
          : isWinner
            ? (isDark ? '#e8f5e9' : '#1b5e20')
            : isLoser
              ? 'text.disabled'
              : 'text.primary',
        fontStyle: hasBye ? 'italic' : 'normal',
        textDecoration: isLoser ? 'line-through' : 'none',
      }}>
        {name || 'Ожидание'}
      </Typography>
      {score !== null && (
        <Box sx={{
          minWidth: 28, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '6px', fontVariantNumeric: 'tabular-nums', transition: 'all 0.25s',
          bgcolor: isWinner ? green : alpha(theme.palette.text.primary, isDark ? 0.08 : 0.06),
          color: isWinner ? '#fff' : isLoser ? alpha(theme.palette.text.primary, 0.35) : alpha(theme.palette.text.primary, 0.6),
          ...(isWinner && { boxShadow: `0 0 8px ${alpha(green, 0.35)}` }),
        }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, lineHeight: 1 }}>{score}</Typography>
        </Box>
      )}
    </Box>
  );
}

/* ═══════════════════ Connector Builders ═══════════════════ */

interface PathData { d: string; active: boolean }

function buildSectionConnectors(
  rounds: RoundData[],
  sectionH: number,
  offsetX: number,
  offsetY: number,
): PathData[] {
  const paths: PathData[] = [];
  const cpOff = CONNECTOR_W * 0.55;

  for (let ri = 0; ri < rounds.length - 1; ri++) {
    const curr = rounds[ri];
    const next = rounds[ri + 1];
    const currCount = curr.matches.length;
    const nextCount = next.matches.length;
    const yCurr = (sectionH - currCount * CELL_H) / 2;
    const yNext = (sectionH - nextCount * CELL_H) / 2;
    const colX = offsetX + ri * (MATCH_W + CONNECTOR_W);
    const x1 = colX + MATCH_W;
    const x2 = colX + MATCH_W + CONNECTOR_W;

    // Determine mapping: if same count → 1:1 (LB drop-in), otherwise 2:1 (standard merge)
    const isOneToOne = currCount === nextCount;

    for (let mi = 0; mi < currCount; mi++) {
      const y = offsetY + yCurr + mi * CELL_H + MATCH_H / 2;
      const ni = isOneToOne ? mi : Math.floor(mi / 2);
      const yN = offsetY + yNext + ni * CELL_H + MATCH_H / 2;
      const isActive = curr.matches[mi]?.status === 'completed' && !!curr.matches[mi]?.winner_id;

      paths.push({
        d: `M ${x1} ${y} C ${x1 + cpOff} ${y}, ${x2 - cpOff} ${yN}, ${x2} ${yN}`,
        active: isActive,
      });
    }
  }
  return paths;
}

function buildCrossConnectors(
  layout: BracketLayout,
  ubOffsetX: number,
  ubOffsetY: number,
  lbOffsetX: number,
  lbOffsetY: number,
): PathData[] {
  const paths: PathData[] = [];
  if (!layout.grandFinal) return paths;

  const gfX = Math.max(layout.upper.length, layout.lower.length) * (MATCH_W + CONNECTOR_W) + PAD;
  const ubSectionH = layout.ubH;
  const lbSectionH = layout.lbH;
  const gfY = (ubOffsetY + ubSectionH / 2 + lbOffsetY + lbSectionH / 2) / 2 - MATCH_H / 2 + MATCH_H / 2;

  // UB Final → Grand Final
  if (layout.upper.length > 0) {
    const lastUB = layout.upper[layout.upper.length - 1];
    const ubFinalX = ubOffsetX + (layout.upper.length - 1) * (MATCH_W + CONNECTOR_W) + MATCH_W;
    const ubFinalY = ubOffsetY + (ubSectionH - lastUB.matches.length * CELL_H) / 2 + MATCH_H / 2;
    const ubActive = lastUB.matches[0]?.status === 'completed' && !!lastUB.matches[0]?.winner_id;
    // Adaptive cpOff proportional to distance
    const ubDist = gfX - ubFinalX;
    const ubCp = Math.max(CONNECTOR_W * 0.55, ubDist * 0.35);
    paths.push({
      d: `M ${ubFinalX} ${ubFinalY} C ${ubFinalX + ubCp} ${ubFinalY}, ${gfX - ubCp} ${gfY}, ${gfX} ${gfY}`,
      active: ubActive,
    });
  }

  // LB Final → Grand Final
  if (layout.lower.length > 0) {
    const lastLB = layout.lower[layout.lower.length - 1];
    const lbFinalX = lbOffsetX + (layout.lower.length - 1) * (MATCH_W + CONNECTOR_W) + MATCH_W;
    const lbFinalY = lbOffsetY + (lbSectionH - lastLB.matches.length * CELL_H) / 2 + MATCH_H / 2;
    const lbActive = lastLB.matches[0]?.status === 'completed' && !!lastLB.matches[0]?.winner_id;
    const lbDist = gfX - lbFinalX;
    const lbCp = Math.max(CONNECTOR_W * 0.55, lbDist * 0.35);
    paths.push({
      d: `M ${lbFinalX} ${lbFinalY} C ${lbFinalX + lbCp} ${lbFinalY}, ${gfX - lbCp} ${gfY}, ${gfX} ${gfY}`,
      active: lbActive,
    });
  }

  return paths;
}

/* ═══════════════════ ZoomPanel ═══════════════════ */

function ZoomPanel({ zoom, onZoomIn, onZoomOut, onFit }: {
  zoom: number; onZoomIn: () => void; onZoomOut: () => void; onFit: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper elevation={0} sx={{
      position: 'absolute', bottom: 16, right: 16, zIndex: 20,
      display: 'flex', alignItems: 'center', gap: 0.3, px: 0.75, py: 0.5, borderRadius: '10px',
      bgcolor: alpha(isDark ? '#1a1d2e' : '#fff', 0.85), backdropFilter: 'blur(16px)',
      border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.15)}`,
      boxShadow: `0 4px 20px ${alpha('#000', isDark ? 0.4 : 0.1)}`,
    }}>
      <Tooltip title="Уменьшить" arrow>
        <IconButton onClick={onZoomOut} sx={{ p: 0.5 }}><ZoomOutIcon sx={{ fontSize: 17 }} /></IconButton>
      </Tooltip>
      <Typography sx={{ minWidth: 40, textAlign: 'center', fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(zoom * 100)}%
      </Typography>
      <Tooltip title="Увеличить" arrow>
        <IconButton onClick={onZoomIn} sx={{ p: 0.5 }}><ZoomInIcon sx={{ fontSize: 17 }} /></IconButton>
      </Tooltip>
      <Box sx={{ width: '1px', height: 18, bgcolor: alpha(theme.palette.divider, 0.12), mx: 0.25 }} />
      <Tooltip title="Вместить" arrow>
        <IconButton onClick={onFit} sx={{ p: 0.5 }}><FitScreenIcon sx={{ fontSize: 17 }} /></IconButton>
      </Tooltip>
    </Paper>
  );
}

/* ═══════════════════ ChampionBanner ═══════════════════ */

const TROPHY_SVG = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 4V2h10v2h3a1 1 0 011 1v3c0 2.21-1.79 4-4 4h-.29A7.01 7.01 0 0113 15.92V18h3a1 1 0 011 1v2H7v-2a1 1 0 011-1h3v-2.08A7.01 7.01 0 017.29 12H7c-2.21 0-4-1.79-4-4V5a1 1 0 011-1h3zm-2 2v2c0 1.1.9 2 2 2h.54A7.06 7.06 0 017 7.46V6H5zm14 0v1.46A7.06 7.06 0 0118.46 10H19c1.1 0 2-.9 2-2V6h-2z"
      fill="currentColor" />
  </svg>
);

function ChampionBanner({ name, accent, isDark }: { name: string; accent: string; isDark: boolean }) {
  const green = '#4caf50';
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
      mb: 1, animation: 'championAppear 0.6s ease-out',
      '@keyframes championAppear': {
        '0%': { opacity: 0, transform: 'translateY(8px) scale(0.95)' },
        '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
      },
    }}>
      {/* Trophy icon */}
      <Box sx={{
        width: 44, height: 44, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha('#ffd700', 0.9)} 0%, ${alpha('#ffb300', 0.95)} 100%)`,
        color: '#5d4037',
        boxShadow: `0 0 20px ${alpha('#ffd700', 0.4)}, 0 0 40px ${alpha('#ffd700', 0.15)}`,
        animation: 'trophyGlow 3s ease-in-out infinite',
        '@keyframes trophyGlow': {
          '0%,100%': { boxShadow: `0 0 16px ${alpha('#ffd700', 0.35)}, 0 0 32px ${alpha('#ffd700', 0.1)}` },
          '50%': { boxShadow: `0 0 24px ${alpha('#ffd700', 0.5)}, 0 0 48px ${alpha('#ffd700', 0.2)}` },
        },
      }}>
        {TROPHY_SVG}
      </Box>
      {/* Champion name */}
      <Box sx={{
        px: 1.5, py: 0.4, borderRadius: '8px',
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#1a2e1a', 0.9)} 0%, ${alpha('#0f1e0f', 0.95)} 100%)`
          : `linear-gradient(135deg, ${alpha('#e8f5e9', 0.95)} 0%, ${alpha('#c8e6c9', 0.9)} 100%)`,
        border: `1px solid ${alpha(green, isDark ? 0.3 : 0.35)}`,
        boxShadow: `0 0 12px ${alpha(green, 0.15)}`,
      }}>
        <Typography sx={{
          fontSize: '0.7rem', fontWeight: 800, letterSpacing: 1,
          textTransform: 'uppercase', textAlign: 'center',
          color: isDark ? '#a5d6a7' : '#2e7d32',
        }}>
          {name}
        </Typography>
      </Box>
    </Box>
  );
}

/* ═══════════════════ Section Renderer ═══════════════════ */

function RoundsSection({
  rounds, sectionH, offsetX, offsetY, sectionLabel, accent, isDark, isFinalHighlight,
  onMatchClick, handleCardClick,
}: {
  rounds: RoundData[]; sectionH: number; offsetX: number; offsetY: number;
  sectionLabel?: string; accent: string; isDark: boolean; isFinalHighlight: boolean;
  onMatchClick?: (m: BracketMatch) => void; handleCardClick: (m: BracketMatch) => void;
}) {
  const theme = useTheme();
  return (
    <>
      {/* Section label */}
      {sectionLabel && (
        <div style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY - HEADER_H - 20,
          width: rounds.length * (MATCH_W + CONNECTOR_W),
        }}>
          <Typography sx={{
            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2,
            color: alpha(accent, 0.5),
          }}>
            {sectionLabel}
          </Typography>
        </div>
      )}

      {rounds.map((round, ri) => {
        const offset = (sectionH - round.matches.length * CELL_H) / 2;
        const isFinal = isFinalHighlight && ri === rounds.length - 1;
        const colX = offsetX + ri * (MATCH_W + CONNECTOR_W);

        return (
          <div key={`${round.label}-${round.round}`} style={{
            position: 'absolute', left: colX, top: offsetY - HEADER_H, width: MATCH_W,
          }}>
            {/* Round header */}
            <Box sx={{
              height: HEADER_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '10px', position: 'relative', overflow: 'hidden',
              background: isFinal
                ? `linear-gradient(135deg, ${alpha(accent, 0.2)} 0%, ${alpha(accent, 0.08)} 100%)`
                : `linear-gradient(135deg, ${alpha(isDark ? '#1a1d2e' : '#e8eaf0', 0.7)} 0%, ${alpha(isDark ? '#12141f' : '#dfe1e8', 0.5)} 100%)`,
              border: `1px solid ${isFinal ? alpha(accent, 0.25) : alpha(theme.palette.divider, isDark ? 0.1 : 0.15)}`,
              mb: 0.5,
            }}>
              {isFinal && (
                <Box sx={{
                  position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '2px',
                  background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                }} />
              )}
              <Typography sx={{
                color: isFinal ? accent : isDark ? alpha('#fff', 0.6) : alpha('#000', 0.55),
                textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.6rem', fontWeight: 800,
              }}>
                {round.label}
              </Typography>
            </Box>

            {/* Matches */}
            {round.matches.map((match, mi) => {
              const showChampion = isFinal && round.matches.length === 1 && !!match.winner_name;
              return (
                <div key={match.id} style={{
                  position: 'absolute',
                  top: HEADER_H + 4 + offset + mi * CELL_H - (showChampion ? 80 : 0),
                  left: 0, width: MATCH_W,
                }}>
                  {showChampion && (
                    <ChampionBanner name={match.winner_name!} accent={accent} isDark={isDark} />
                  )}
                  <MatchCard match={match} accent={accent}
                    onClick={onMatchClick ? () => handleCardClick(match) : undefined} />
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

/* ═══════════════════ BracketView ═══════════════════ */

export const BracketView = memo(function BracketView({
  matches, accentColor, onMatchClick,
}: BracketViewProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = accentColor || theme.palette.primary.main;

  /* ── layout computation ── */
  const layout = useMemo(() => computeLayout(matches), [matches]);

  const ubOffsetX = PAD;
  const ubOffsetY = PAD + HEADER_H + (layout.isDouble ? 24 : 0);
  const lbOffsetX = PAD;
  const lbOffsetY = ubOffsetY + layout.ubH + SECTION_GAP + (layout.isDouble ? 24 : 0);

  const gfX = Math.max(layout.upper.length, layout.lower.length) * (MATCH_W + CONNECTOR_W) + PAD;
  const gfY = layout.isDouble
    ? (ubOffsetY + layout.ubH / 2 + lbOffsetY + layout.lbH / 2) / 2
    : ubOffsetY + layout.ubH / 2;

  // Final content dimensions
  const contentW = gfX + (layout.grandFinal ? MATCH_W + PAD : 0) + PAD;
  const contentH = layout.isDouble
    ? lbOffsetY + layout.lbH + HEADER_H + PAD
    : ubOffsetY + layout.ubH + HEADER_H + PAD;

  /* ── connectors ── */
  const allPaths = useMemo(() => {
    const ubPaths = buildSectionConnectors(layout.upper, layout.ubH, ubOffsetX, ubOffsetY);
    const lbPaths = layout.isDouble ? buildSectionConnectors(layout.lower, layout.lbH, lbOffsetX, lbOffsetY) : [];
    const crossPaths = layout.isDouble ? buildCrossConnectors(layout, ubOffsetX, ubOffsetY, lbOffsetX, lbOffsetY) : [];
    return [...ubPaths, ...lbPaths, ...crossPaths];
  }, [layout, ubOffsetX, ubOffsetY, lbOffsetX, lbOffsetY]);

  /* ── zoom / pan ── */
  const boxRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef({
    active: false, startX: 0, startY: 0, panX: 0, panY: 0, moved: false,
    /* touch pinch */
    pinching: false, initDist: 0, initZoom: 1, midX: 0, midY: 0,
  });

  const fitToView = useCallback(() => {
    const el = boxRef.current;
    if (!el || matches.length === 0) return;
    const bw = el.clientWidth;
    const bh = el.clientHeight;
    const z = clamp(Math.min(bw / contentW, bh / contentH) * 0.85, MIN_ZOOM, MAX_ZOOM);
    setZoom(z);
    setPan({ x: (bw - contentW * z) / 2, y: (bh - contentH * z) / 2 });
  }, [contentW, contentH, matches.length]);

  useEffect(() => { fitToView(); }, [fitToView]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const ds = dragState.current;
    ds.active = true; ds.moved = false;
    ds.startX = e.clientX; ds.startY = e.clientY;
    ds.panX = pan.x; ds.panY = pan.y;
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const ds = dragState.current;
    if (!ds.active) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) ds.moved = true;
    setPan({ x: ds.panX + dx, y: ds.panY + dy });
  }, []);

  const onMouseUp = useCallback(() => { dragState.current.active = false; }, []);

  /* ── touch handlers (mobile) ── */

  const touchDist = (a: React.Touch, b: React.Touch) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const ds = dragState.current;
    if (e.touches.length === 2) {
      // pinch-to-zoom start
      ds.pinching = true;
      ds.initDist = touchDist(e.touches[0], e.touches[1]);
      ds.initZoom = zoom;
      ds.midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      ds.midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    } else if (e.touches.length === 1) {
      // single finger drag
      ds.active = true; ds.moved = false;
      ds.startX = e.touches[0].clientX;
      ds.startY = e.touches[0].clientY;
      ds.panX = pan.x; ds.panY = pan.y;
    }
  }, [pan, zoom]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const ds = dragState.current;
    if (ds.pinching && e.touches.length === 2) {
      const el = boxRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dist = touchDist(e.touches[0], e.touches[1]);
      const nz = clamp(ds.initZoom * (dist / ds.initDist), MIN_ZOOM, MAX_ZOOM);
      const mx = ds.midX - rect.left;
      const my = ds.midY - rect.top;
      const s = nz / zoom;
      setPan((p) => ({ x: mx - (mx - p.x) * s, y: my - (my - p.y) * s }));
      setZoom(nz);
    } else if (ds.active && e.touches.length === 1) {
      const dx = e.touches[0].clientX - ds.startX;
      const dy = e.touches[0].clientY - ds.startY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) ds.moved = true;
      setPan({ x: ds.panX + dx, y: ds.panY + dy });
    }
  }, [zoom]);

  const onTouchEnd = useCallback(() => {
    const ds = dragState.current;
    ds.active = false;
    ds.pinching = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dir = e.deltaY < 0 ? 1 : -1;
    const factor = 1 + dir * ZOOM_STEP;
    setZoom((z) => {
      const nz = clamp(z * factor, MIN_ZOOM, MAX_ZOOM);
      const s = nz / z;
      setPan((p) => ({ x: mx - (mx - p.x) * s, y: my - (my - p.y) * s }));
      return nz;
    });
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => clamp(z * (1 + ZOOM_STEP), MIN_ZOOM, MAX_ZOOM)), []);
  const zoomOut = useCallback(() => setZoom((z) => clamp(z / (1 + ZOOM_STEP), MIN_ZOOM, MAX_ZOOM)), []);

  const handleCardClick = useCallback((m: BracketMatch) => {
    if (dragState.current.moved) return;
    onMatchClick?.(m);
  }, [onMatchClick]);

  /* ── empty state ── */
  if (matches.length === 0) {
    return (
      <Box sx={{
        textAlign: 'center', py: 10, borderRadius: 3,
        border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
        background: alpha(theme.palette.background.paper, 0.3),
      }}>
        <Typography color="text.secondary" fontSize="0.9rem" sx={{ opacity: 0.6 }}>
          Сетка ещё не сгенерирована
        </Typography>
      </Box>
    );
  }

  return (
    <Box ref={boxRef}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      sx={{
        position: 'relative', width: '100%',
        height: layout.isDouble ? 'clamp(500px, 80vh, 1100px)' : 'clamp(420px, 68vh, 900px)',
        overflow: 'hidden', borderRadius: '16px', userSelect: 'none',
        touchAction: 'none', WebkitOverflowScrolling: 'touch',
        cursor: dragState.current.active ? 'grabbing' : 'grab',
        /* Crisp rendering at any zoom level */
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
        imageRendering: 'auto',
        background: isDark
          ? `radial-gradient(ellipse 80% 60% at 20% 40%, ${alpha(accent, 0.04)} 0%, transparent 70%),
             radial-gradient(ellipse 60% 80% at 80% 20%, ${alpha('#3b82f6', 0.03)} 0%, transparent 60%),
             linear-gradient(160deg, #0a0c14 0%, #0d1017 30%, #0f1219 60%, #0a0c14 100%)`
          : `radial-gradient(ellipse 80% 60% at 20% 40%, ${alpha(accent, 0.04)} 0%, transparent 70%),
             linear-gradient(160deg, #f8f9fc 0%, #f0f1f5 50%, #f8f9fc 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.08 : 0.12)}`,
        '&::before': {
          content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: isDark
            ? `radial-gradient(circle, ${alpha('#fff', 0.018)} 1px, transparent 1px)`
            : `radial-gradient(circle, ${alpha('#000', 0.02)} 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          imageRendering: 'auto',
        },
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, transformOrigin: '0 0',
        transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
        width: contentW, height: contentH, zIndex: 1,
        /* Prevents GPU rasterization at fixed resolution — keeps elements crisp at any zoom */
        backfaceVisibility: 'hidden',
      }}>
        {/* SVG connectors */}
        <svg
          width={contentW} height={contentH}
          viewBox={`0 0 ${contentW} ${contentH}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
            shapeRendering: 'geometricPrecision',
          }}
        >
          <defs>
            <filter id="connBlur"><feGaussianBlur stdDeviation="3" /></filter>
          </defs>
          {allPaths.map(({ d, active }, i) => (
            <g key={i}>
              {active && (
                <path d={d} stroke={accent} strokeWidth={5} fill="none"
                  strokeLinecap="round" filter="url(#connBlur)" opacity={0.25} />
              )}
              <path d={d}
                stroke={active ? alpha(accent, 0.55) : alpha(isDark ? '#fff' : '#000', 0.08)}
                strokeWidth={active ? 2.5 : 1.5} fill="none" strokeLinecap="round"
                shapeRendering="geometricPrecision" />
            </g>
          ))}
        </svg>

        {/* Верхняя сетка */}
        <RoundsSection
          rounds={layout.upper} sectionH={layout.ubH}
          offsetX={ubOffsetX} offsetY={ubOffsetY}
          sectionLabel={layout.isDouble ? 'Верхняя сетка' : undefined}
          accent={accent} isDark={isDark} isFinalHighlight={!layout.isDouble}
          onMatchClick={onMatchClick} handleCardClick={handleCardClick}
        />

        {/* Нижняя сетка */}
        {layout.isDouble && layout.lower.length > 0 && (
          <RoundsSection
            rounds={layout.lower} sectionH={layout.lbH}
            offsetX={lbOffsetX} offsetY={lbOffsetY}
            sectionLabel="Нижняя Сетка"
            accent={accent} isDark={isDark} isFinalHighlight={false}
            onMatchClick={onMatchClick} handleCardClick={handleCardClick}
          />
        )}

        {/* Гранд-финал */}
        {layout.grandFinal && (() => {
          const gf = layout.grandFinal!;
          const hasChampion = !!gf.winner_name;
          return (
            <div style={{
              position: 'absolute', left: gfX,
              top: gfY - MATCH_H / 2 - HEADER_H - 4 - (hasChampion ? 80 : 0),
              width: MATCH_W,
            }}>
              {hasChampion && (
                <ChampionBanner name={gf.winner_name!} accent={accent} isDark={isDark} />
              )}
              <Box sx={{
                height: HEADER_H, width: MATCH_W, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '10px', position: 'relative', overflow: 'hidden', mb: 0.5,
                background: `linear-gradient(135deg, ${alpha(accent, 0.25)} 0%, ${alpha(accent, 0.1)} 100%)`,
                border: `1px solid ${alpha(accent, 0.3)}`,
              }}>
                <Box sx={{
                  position: 'absolute', bottom: 0, left: '15%', right: '15%', height: '2px',
                  background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                }} />
                <Typography sx={{
                  color: accent, textTransform: 'uppercase', letterSpacing: 3,
                  fontSize: '0.65rem', fontWeight: 900,
                }}>
                  Гранд-финал
                </Typography>
              </Box>
              <MatchCard match={gf} accent={accent}
                onClick={onMatchClick ? () => handleCardClick(gf) : undefined} />
            </div>
          );
        })()}
      </div>

      <ZoomPanel zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onFit={fitToView} />

      <Typography sx={{
        position: 'absolute', bottom: 18, left: 18,
        color: alpha(theme.palette.text.secondary, 0.25),
        fontSize: '0.6rem', pointerEvents: 'none', letterSpacing: 0.5, zIndex: 10,
        display: { xs: 'none', sm: 'block' },
      }}>
        Скролл — зум · Тяните мышкой
      </Typography>
      <Typography sx={{
        position: 'absolute', bottom: 18, left: 18,
        color: alpha(theme.palette.text.secondary, 0.25),
        fontSize: '0.6rem', pointerEvents: 'none', letterSpacing: 0.5, zIndex: 10,
        display: { xs: 'block', sm: 'none' },
      }}>
        Тяните пальцем · Щипок — зум
      </Typography>
    </Box>
  );
});
