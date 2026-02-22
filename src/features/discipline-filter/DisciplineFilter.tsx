import { memo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import { useDisciplineStore } from '@/entities/discipline/model';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { getDisciplineColor } from '@/shared/lib/discipline-colors';
import { DisciplineAvatar } from '@/shared/ui/discipline-avatar/DisciplineAvatar';

interface Props {
  selected: string;
  onSelect: (discipline: string) => void;
  availableDisciplines?: string[];
}

const CHIP_HEIGHT = 38;

export const DisciplineFilter = memo(function DisciplineFilter({
  selected,
  onSelect,
  availableDisciplines,
}: Props) {
  const { disciplines, colorsMap } = useDisciplineStore();
  const theme = useTheme();

  const names = disciplines.map((d) => d.name);
  const filtered = availableDisciplines
    ? names.filter((n) => availableDisciplines.includes(n))
    : names;

  const handleSelectAll = useCallback(() => onSelect('all'), [onSelect]);

  const isAllActive = selected === 'all';
  const primary = theme.palette.primary.main;

  return (
    <Box sx={{ mb: 3.5 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.25,
        }}
      >
        <Chip
          label="Все"
          variant={isAllActive ? 'filled' : 'outlined'}
          onClick={handleSelectAll}
          sx={{
            height: CHIP_HEIGHT,
            px: 1,
            fontSize: '0.9rem',
            fontWeight: isAllActive ? 700 : 500,
            borderRadius: '10px',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            ...(isAllActive
              ? {
                  background: `linear-gradient(135deg, ${primary} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: '#fff',
                  border: 'none',
                  boxShadow: `0 4px 14px ${alpha(primary, 0.4)}`,
                }
              : {
                  borderColor: alpha('#fff', 0.15),
                  color: alpha('#fff', 0.7),
                }),
            '&:hover': {
              transform: 'translateY(-2px)',
              ...(isAllActive
                ? { boxShadow: `0 6px 20px ${alpha(primary, 0.5)}` }
                : {
                    borderColor: alpha(primary, 0.5),
                    bgcolor: alpha(primary, 0.08),
                    color: '#fff',
                  }),
            },
          }}
        />

        {filtered.map((name) => {
          const disc = disciplines.find((d) => d.name === name);
          const iconUrl = getDisciplineIconUrl(name, disc?.logo_url);
          const color = getDisciplineColor(name, colorsMap[name]);
          const isActive = selected === name;

          return (
            <Chip
              key={name}
              label={name}
              variant="outlined"
              onClick={() => onSelect(name)}
              avatar={
                iconUrl ? (
                  <DisciplineAvatar src={iconUrl} alt={name} size={26} />
                ) : undefined
              }
              sx={{
                height: CHIP_HEIGHT,
                px: 0.75,
                fontSize: '0.9rem',
                borderRadius: '10px',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                fontWeight: isActive ? 700 : 500,
                borderWidth: 1.5,
                borderColor: alpha(color, isActive ? 0.9 : 0.25),
                color: isActive ? '#fff' : alpha(color, 0.85),
                bgcolor: isActive ? alpha(color, 0.18) : 'transparent',
                ...(isActive && {
                  boxShadow: `0 4px 14px ${alpha(color, 0.35)}, inset 0 0 0 1px ${alpha(color, 0.15)}`,
                  background: `linear-gradient(135deg, ${alpha(color, 0.22)} 0%, ${alpha(color, 0.1)} 100%)`,
                }),
                '& .MuiChip-avatar': {
                  width: 26,
                  height: 26,
                  ml: 0.25,
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  borderColor: alpha(color, 0.7),
                  bgcolor: alpha(color, isActive ? 0.25 : 0.1),
                  color: '#fff',
                  ...(isActive && {
                    boxShadow: `0 6px 20px ${alpha(color, 0.45)}, inset 0 0 0 1px ${alpha(color, 0.2)}`,
                  }),
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
});
