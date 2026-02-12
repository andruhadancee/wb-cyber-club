import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useRegulationStore } from '@/entities/regulation/model';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';

export function RegulationsPage() {
  const { hideLoader } = useOutletContext<{ hideLoader: () => void }>();
  const { regulations, fetchAll } = useRegulationStore();

  useEffect(() => {
    fetchAll().finally(hideLoader);
  }, [fetchAll, hideLoader]);

  return (
    <>
      <h1 className="page-title" style={{ textAlign: 'center', marginBottom: 32 }}>
        Регламент турниров
      </h1>
      <div className="regulations-grid" id="regulations-grid">
        {regulations.length === 0 ? (
          <div className="empty-state">
            <h3>Регламенты пока не добавлены</h3>
            <p>Регламенты появятся здесь после их добавления администратором</p>
          </div>
        ) : (
          regulations.map((reg) => {
            const iconUrl = getDisciplineIconUrl(reg.discipline_name);
            return (
              <a
                key={reg.id}
                href={reg.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="regulation-card"
              >
                {iconUrl ? (
                  <img src={iconUrl} className="discipline-icon" alt={reg.discipline_name} />
                ) : (
                  <span className="discipline-icon discipline-icon-emoji">🎮</span>
                )}
                <div className="regulation-info">
                  <h3>
                    {reg.discipline_name}
                    {reg.regulation_name && (
                      <>
                        <br />
                        <span style={{ fontSize: '0.85em', opacity: 0.8, fontWeight: 400 }}>
                          {reg.regulation_name}
                        </span>
                      </>
                    )}
                  </h3>
                  <span className="regulation-badge">PDF</span>
                </div>
              </a>
            );
          })
        )}
      </div>
    </>
  );
}
