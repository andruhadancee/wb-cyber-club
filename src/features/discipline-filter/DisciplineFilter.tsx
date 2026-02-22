import { memo } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import { useDisciplineStore } from '@/entities/discipline/model';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { getDisciplineColor } from '@/shared/lib/discipline-colors';

interface Props {
  selected: string;
  onSelect: (discipline: string) => void;
  availableDisciplines?: string[];
  colored?: boolean;
}

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

  return (
    <Box sx={{ mb: 3.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label="Все"
          variant={selected === 'all' ? 'filled' : 'outlined'}
          color={selected === 'all' ? 'primary' : 'default'}
          onClick={() => onSelect('all')}
          sx={{
            transition: 'all 0.2s ease',
            fontWeight: selected === 'all' ? 600 : 500,
            ...(selected === 'all' && {
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
            }),
            '&:hover': { transform: 'translateY(-1px)' },
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
                  <Box
                    component="img"
                    src={iconUrl}
                    alt={name}
                    sx={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : undefined
              }
              sx={{
                transition: 'all 0.2s ease',
                fontWeight: isActive ? 700 : 500,
                borderColor: alpha(color, isActive ? 0.8 : 0.35),
                color: isActive ? '#fff' : alpha(color, 0.9),
                bgcolor: isActive ? alpha(color, 0.2) : 'transparent',
                ...(isActive && {
                  boxShadow: `0 2px 10px ${alpha(color, 0.35)}`,
                  borderWidth: 1.5,
                }),
                '&:hover': {
                  transform: 'translateY(-1px)',
                  bgcolor: alpha(color, isActive ? 0.25 : 0.08),
                  borderColor: alpha(color, 0.6),
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
});
