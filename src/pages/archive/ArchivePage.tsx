import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTournamentStore } from '@/entities/tournament/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { formatDateForDisplay, parseTournamentDate } from '@/shared/lib/date';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import type { Tournament } from '@/entities/tournament/types';

export function ArchivePage() {
  const { hideLoader } = useOutletContext<{ hideLoader: () => void }>();
  const { pastTournaments, fetchPast } = useTournamentStore();
  const { fetchAll: fetchDisciplines } = useDisciplineStore();
  const [selected, setSelected] = useState('all');

  useEffect(() => {
    Promise.all([fetchPast(), fetchDisciplines()]).finally(hideLoader);
  }, [fetchPast, fetchDisciplines, hideLoader]);

  const sorted = useMemo(() => {
    let list = [...pastTournaments];
    if (selected !== 'all') list = list.filter((t) => t.discipline === selected);
    return list.sort((a, b) => {
      const da = parseTournamentDate(a.date);
      const db = parseTournamentDate(b.date);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    });
  }, [pastTournaments, selected]);

  const available = [...new Set(pastTournaments.map((t) => t.discipline))];

  return (
    <>
      <DisciplineFilter selected={selected} onSelect={setSelected} availableDisciplines={available} />
      <div className="tournaments-grid" id="archive-grid">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <h3>{selected === 'all' ? 'Прошедших турниров пока нет' : 'Турниров по выбранной дисциплине нет'}</h3>
            <p>{selected === 'all' ? 'История турниров появится здесь после их завершения' : 'Попробуйте выбрать другую дисциплину'}</p>
          </div>
        ) : (
          sorted.map((t) => <ArchiveCard key={t.id} tournament={t} />)
        )}
      </div>
    </>
  );
}

function ArchiveCard({ tournament }: { tournament: Tournament }) {
  const watchUrl = tournament.watch_url?.trim() || null;
  const imageUrl = tournament.image_url?.trim() || null;
  const iconUrl = getDisciplineIconUrl(tournament.discipline);

  return (
    <div className="tournament-card">
      {imageUrl && (
        <div className="tournament-card-image">
          <img src={imageUrl} alt={tournament.title} />
        </div>
      )}
      <div className="tournament-card-header">
        <h2>{tournament.title}</h2>
      </div>
      <div className="tournament-info">
        <div className="info-row">
          <div className="info-item">
            <span className="info-label">Дисциплина</span>
            <span className="info-value">
              <span className="discipline-with-icon">
                {iconUrl ? (
                  <img src={iconUrl} className="discipline-icon" alt={tournament.discipline} />
                ) : (
                  <span className="discipline-icon discipline-icon-emoji">🎮</span>
                )}
                <span>{tournament.discipline}</span>
              </span>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Дата</span>
            <span className="info-value">{formatDateForDisplay(tournament.date)}</span>
          </div>
        </div>
        <div className="info-row">
          <div className="info-item">
            <span className="info-label">Призовой фонд</span>
            <span className="info-value">{tournament.prize}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Команд участвовало</span>
            <span className="info-value">{tournament.teams || 0}</span>
          </div>
        </div>
        {tournament.winner && (
          <div className="info-row">
            <div className="info-item" style={{ width: '100%' }}>
              <span className="info-label">🏆 Победитель</span>
              <span className="info-value" style={{ color: 'var(--color-pink-light)', fontWeight: 600 }}>
                {tournament.winner}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="tournament-watch-button-container">
        {watchUrl && (
          <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="btn-submit">
            Смотреть
          </a>
        )}
      </div>
    </div>
  );
}
