import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTournamentStore } from '@/entities/tournament/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { linksApi, type RegistrationLinks } from '@/shared/api/linksApi';
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { TournamentCard } from '@/widgets/tournament-card/TournamentCard';

export function TournamentsPage() {
  const { hideLoader } = useOutletContext<{ hideLoader: () => void }>();
  const { activeTournaments, fetchActive } = useTournamentStore();
  const { fetchAll: fetchDisciplines } = useDisciplineStore();
  const [selected, setSelected] = useState('all');
  const [links, setLinks] = useState<RegistrationLinks>({});

  useEffect(() => {
    Promise.all([
      fetchActive(),
      fetchDisciplines(),
      linksApi.getAll().then(setLinks),
    ]).finally(hideLoader);
  }, [fetchActive, fetchDisciplines, hideLoader]);

  const available = [...new Set(activeTournaments.map((t) => t.discipline))];
  const filtered = selected === 'all'
    ? activeTournaments
    : activeTournaments.filter((t) => t.discipline === selected);

  const getRegLink = (t: typeof activeTournaments[0]) => {
    if (t.custom_link?.trim()) return t.custom_link.trim();
    if (links[t.discipline]) return links[t.discipline];
    return '#';
  };

  return (
    <>
      <DisciplineFilter
        selected={selected}
        onSelect={setSelected}
        availableDisciplines={available}
      />
      <div className="tournaments-grid" id="tournaments-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>{selected === 'all' ? 'Активных турниров пока нет' : 'Турниров по выбранной дисциплине нет'}</h3>
            {selected === 'all' && <p>Следите за обновлениями в наших социальных сетях</p>}
          </div>
        ) : (
          filtered.map((t) => (
            <TournamentCard key={t.id} tournament={t} regLink={getRegLink(t)} />
          ))
        )}
      </div>
    </>
  );
}
