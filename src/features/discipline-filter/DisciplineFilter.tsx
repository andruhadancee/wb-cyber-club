import { useDisciplineStore } from '@/entities/discipline/model';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { getDisciplineColor } from '@/shared/lib/discipline-colors';

interface Props {
  selected: string;
  onSelect: (discipline: string) => void;
  /** Ограничить только этими дисциплинами (если переданы) */
  availableDisciplines?: string[];
  /** Показывать цветной фон кнопок (как в календаре) */
  colored?: boolean;
}

export function DisciplineFilter({
  selected,
  onSelect,
  availableDisciplines,
  colored = false,
}: Props) {
  const { disciplines, colorsMap } = useDisciplineStore();

  const names = disciplines.map((d) => d.name);
  const filtered = availableDisciplines
    ? names.filter((n) => availableDisciplines.includes(n))
    : names;

  return (
    <div className="filters-container">
      <div className="filter-label">Фильтр по дисциплинам:</div>
      <div className="filters">
        <button
          className={`filter-btn${selected === 'all' ? ' active' : ''}`}
          onClick={() => onSelect('all')}
        >
          Все
        </button>
        {filtered.map((name) => {
          const iconUrl = getDisciplineIconUrl(
            name,
            disciplines.find((d) => d.name === name)?.logo_url,
          );
          const color = colored
            ? getDisciplineColor(name, colorsMap[name])
            : undefined;

          return (
            <button
              key={name}
              className={`filter-btn${selected === name ? ' active' : ''}`}
              onClick={() => onSelect(name)}
              style={
                color
                  ? { background: color, borderColor: color, opacity: 0.75, filter: 'brightness(0.85)' }
                  : undefined
              }
            >
              {iconUrl ? (
                <img src={iconUrl} className="discipline-icon" alt={name} />
              ) : (
                <span className="discipline-icon discipline-icon-emoji">🎮</span>
              )}{' '}
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
