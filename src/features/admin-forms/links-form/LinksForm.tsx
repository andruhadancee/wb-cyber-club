import { useState, useEffect } from 'react';
import { useDisciplineStore } from '@/entities/discipline/model';
import { linksApi, type RegistrationLinks } from '@/shared/api/linksApi';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';

export function LinksForm() {
  const { disciplines, fetchAll } = useDisciplineStore();
  const [links, setLinks] = useState<RegistrationLinks>({});

  useEffect(() => {
    fetchAll();
    linksApi.getAll().then(setLinks);
  }, [fetchAll]);

  const handleChange = (discipline: string, value: string) => {
    setLinks((prev) => ({ ...prev, [discipline]: value }));
  };

  const handleSave = async () => {
    try {
      await linksApi.save(links);
      alert('Ссылки сохранены!');
    } catch (error) {
      alert('Ошибка сохранения: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="links-container">
      <h2>Ссылки на формы регистрации</h2>
      <p className="hint">Укажите ссылки на Google Forms для каждой дисциплины</p>
      <div className="links-grid">
        {disciplines.map((d) => {
          const iconUrl = getDisciplineIconUrl(d.name, d.logo_url);
          return (
            <div className="link-item" key={d.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {iconUrl ? (
                  <img src={iconUrl} className="discipline-icon" alt={d.name} />
                ) : (
                  <span className="discipline-icon discipline-icon-emoji">🎮</span>
                )}
                <label style={{ marginBottom: 0, flex: 1 }}>{d.name}</label>
              </div>
              <input
                type="text"
                className="link-input"
                value={links[d.name] || ''}
                onChange={(e) => handleChange(d.name, e.target.value)}
                placeholder="https://..."
              />
            </div>
          );
        })}
      </div>
      <button className="btn-primary" onClick={handleSave}>Сохранить ссылки</button>
    </div>
  );
}
