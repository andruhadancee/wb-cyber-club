import { memo } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { alpha, useTheme } from '@mui/material/styles';
import { useDisciplineStore } from '@/entities/discipline/model';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';

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
  const { disciplines } = useDisciplineStore();
  const theme = useTheme();

  const names = disciplines.map((d) => d.name);
  const filtered = availableDisciplines
    ? names.filter((n) => availableDisciplines.includes(n))
    : names;

  const chipSx = (isActive: boolean) => ({
    transition: 'all 0.2s ease',
    fontWeight: isActive ? 600 : 500,
    ...(isActive && {
      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
    }),
    '&:hover': {
      transform: 'translateY(-1px)',
    },
  });

  return (
    <Box sx={{ mb: 3.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label="Все"
          variant={selected === 'all' ? 'filled' : 'outlined'}
          color={selected === 'all' ? 'primary' : 'default'}
          onClick={() => onSelect('all')}
          sx={chipSx(selected === 'all')}
        />
        {filtered.map((name) => {
          const iconUrl = getDisciplineIconUrl(
            name,
            disciplines.find((d) => d.name === name)?.logo_url,
          );
          const isActive = selected === name;
          return (
            <Chip
              key={name}
              label={name}
              variant={isActive ? 'filled' : 'outlined'}
              color={isActive ? 'primary' : 'default'}
              onClick={() => onSelect(name)}
              avatar={
                iconUrl ? (
                  <Box
                    component="img"
                    src={iconUrl}
                    alt={name}
                    sx={{ width: 20, height: 20, borderRadius: '50%' }}
                  />
                ) : undefined
              }
              sx={chipSx(isActive)}
            />
          );
        })}
      </Box>
    </Box>
  );
});
