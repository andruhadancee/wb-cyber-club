import { useState, useEffect, useCallback } from 'react';
import { useTournamentStore } from '@/entities/tournament/model';
import { useTeamStore } from '@/entities/team/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { useCalendarStore } from '@/entities/calendar-event/model';
import { useRegulationStore } from '@/entities/regulation/model';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { getDisciplineColor } from '@/shared/lib/discipline-colors';
import { formatDateForDisplay } from '@/shared/lib/date';
import { clearCache } from '@/shared/lib/cache';
import { Modal } from '@/shared/ui/modal/Modal';
import { TournamentForm } from '@/features/admin-forms/tournament-form/TournamentForm';
import { TeamForm } from '@/features/admin-forms/team-form/TeamForm';
import { CalendarEventForm } from '@/features/admin-forms/calendar-form/CalendarEventForm';
import { RegulationForm } from '@/features/admin-forms/regulation-form/RegulationForm';
import { DisciplineForm } from '@/features/admin-forms/discipline-form/DisciplineForm';
import { LinksForm } from '@/features/admin-forms/links-form/LinksForm';
import { SocialForm } from '@/features/admin-forms/social-form/SocialForm';
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { CalendarGrid } from '@/widgets/calendar-grid/CalendarGrid';
import { linksApi } from '@/shared/api/linksApi';
import type { Tournament } from '@/entities/tournament/types';
import type { Team } from '@/entities/team/types';
import type { CalendarEvent } from '@/entities/calendar-event/types';
import type { Regulation } from '@/entities/regulation/types';
import type { Discipline } from '@/entities/discipline/types';

type TabName = 'active' | 'past' | 'teams' | 'calendar' | 'disciplines' | 'links' | 'regulations' | 'social';

const TABS: { key: TabName; label: string }[] = [
  { key: 'active', label: 'Активные турниры' },
  { key: 'past', label: 'Архив турниров' },
  { key: 'teams', label: 'Зарегистрированные команды' },
  { key: 'calendar', label: 'Календарь' },
  { key: 'disciplines', label: 'Дисциплины' },
  { key: 'links', label: 'Ссылки на формы' },
  { key: 'regulations', label: 'Регламент' },
  { key: 'social', label: 'Социальные кнопки' },
];

export function AdminPanel() {
  const savedTab = localStorage.getItem('adminActiveTab') as TabName | null;
  const [tab, setTab] = useState<TabName>(savedTab || 'active');
  const [filterActive, setFilterActive] = useState('all');
  const [filterPast, setFilterPast] = useState('all');
  const [filterTeams, setFilterTeams] = useState('all');
  const [filterCalendar, setFilterCalendar] = useState('all');
  const [regLinks, setRegLinks] = useState<Record<string, string>>({});

  // Modal states
  const [tournamentModal, setTournamentModal] = useState<{ open: boolean; tournament?: Tournament; isPast?: boolean }>({ open: false });
  const [teamModal, setTeamModal] = useState<{ open: boolean; team?: Team }>({ open: false });
  const [calendarModal, setCalendarModal] = useState<{ open: boolean; event?: CalendarEvent; defaultDate?: string }>({ open: false });
  const [regulationModal, setRegulationModal] = useState<{ open: boolean; regulation?: Regulation }>({ open: false });
  const [disciplineModal, setDisciplineModal] = useState<{ open: boolean; discipline?: Discipline }>({ open: false });

  // Stores
  const tournamentStore = useTournamentStore();
  const teamStore = useTeamStore();
  const disciplineStore = useDisciplineStore();
  const calendarStore = useCalendarStore();
  const regulationStore = useRegulationStore();

  const switchTab = useCallback((t: TabName) => {
    setTab(t);
    localStorage.setItem('adminActiveTab', t);
    if (t === 'teams') teamStore.fetchAll();
    if (t === 'calendar') calendarStore.fetchEvents();
  }, [teamStore, calendarStore]);

  useEffect(() => {
    tournamentStore.fetchActive();
    tournamentStore.fetchPast();
    disciplineStore.fetchAll();
    regulationStore.fetchAll();
    calendarStore.fetchEvents();
    linksApi.getAll().then(setRegLinks);
  }, []);

  // Active tournaments tab
  const renderActive = () => {
    const available = [...new Set(tournamentStore.activeTournaments.map((t) => t.discipline))];
    const filtered = filterActive === 'all'
      ? tournamentStore.activeTournaments
      : tournamentStore.activeTournaments.filter((t) => t.discipline === filterActive);

    return (
      <>
        <div style={{ marginBottom: 20 }}>
          <button className="btn-primary" onClick={() => setTournamentModal({ open: true })}>
            + Добавить турнир
          </button>
        </div>
        <DisciplineFilter selected={filterActive} onSelect={setFilterActive} availableDisciplines={available} />
        <div className="tournaments-admin-grid">
          {filtered.length === 0 ? (
            <div className="empty-state"><p>Нет активных турниров</p></div>
          ) : filtered.map((t) => (
            <div key={t.id} className="tournament-admin-card">
              <div className="tournament-admin-info">
                <div className="info-item">
                  <span className="info-label">Название</span>
                  <span className="info-value">{t.title}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Дисциплина</span>
                  <span className="info-value">{t.discipline}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Дата</span>
                  <span className="info-value">{t.date}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Призовой фонд</span>
                  <span className="info-value">{t.prize}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Команд</span>
                  <span className="info-value">{t.teams || 0} / {t.max_teams}</span>
                </div>
              </div>
              <div className="tournament-admin-actions">
                <button className="btn-edit" onClick={() => setTournamentModal({ open: true, tournament: t })}>Изменить</button>
                <button className="btn-danger" style={{ background: 'rgba(255, 193, 7, 0.8)' }} onClick={() => handleArchive(t)}>В архив</button>
                <button className="btn-danger" onClick={() => handleDeleteTournament(t.id)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // Past tournaments tab
  const renderPast = () => {
    const available = [...new Set(tournamentStore.pastTournaments.map((t) => t.discipline))];
    const filtered = filterPast === 'all'
      ? tournamentStore.pastTournaments
      : tournamentStore.pastTournaments.filter((t) => t.discipline === filterPast);

    return (
      <>
        <div style={{ marginBottom: 20 }}>
          <button className="btn-primary" onClick={() => setTournamentModal({ open: true, isPast: true })}>
            + Добавить прошедший турнир
          </button>
        </div>
        <DisciplineFilter selected={filterPast} onSelect={setFilterPast} availableDisciplines={available} />
        <div className="tournaments-admin-grid">
          {filtered.length === 0 ? (
            <div className="empty-state"><p>Нет прошедших турниров</p></div>
          ) : filtered.map((t) => (
            <div key={t.id} className="tournament-admin-card">
              <div className="tournament-admin-info">
                <div className="info-item"><span className="info-label">Название</span><span className="info-value">{t.title}</span></div>
                <div className="info-item"><span className="info-label">Дисциплина</span><span className="info-value">{t.discipline}</span></div>
                <div className="info-item"><span className="info-label">Дата</span><span className="info-value">{t.date}</span></div>
                <div className="info-item"><span className="info-label">Призовой фонд</span><span className="info-value">{t.prize}</span></div>
                <div className="info-item"><span className="info-label">Команд</span><span className="info-value">{t.teams || 0}</span></div>
                {t.winner && <div className="info-item"><span className="info-label">Победитель</span><span className="info-value">{t.winner}</span></div>}
              </div>
              <div className="tournament-admin-actions">
                <button className="btn-edit" onClick={() => setTournamentModal({ open: true, tournament: t, isPast: true })}>Изменить</button>
                <button className="btn-danger" onClick={() => handleDeleteTournament(t.id)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // Teams tab
  const renderTeams = () => {
    const data = Object.entries(teamStore.teamsByTournament);
    const allTournaments = [...tournamentStore.activeTournaments, ...tournamentStore.pastTournaments];
    const available = [...new Set(data.flatMap(([tid]) => {
      const t = allTournaments.find((x) => String(x.id) === tid);
      return t ? [t.discipline] : [];
    }))];
    const filtered = filterTeams === 'all' ? data : data.filter(([tid]) => {
      const t = allTournaments.find((x) => String(x.id) === tid);
      return t?.discipline === filterTeams;
    });

    return (
      <div className="links-container">
        <div className="admin-header" style={{ marginBottom: 20 }}>
          <h2>Зарегистрированные команды</h2>
          <button className="btn-primary" onClick={() => setTeamModal({ open: true })}>+ Добавить команду</button>
        </div>
        <DisciplineFilter selected={filterTeams} onSelect={setFilterTeams} availableDisciplines={available} />
        <div id="teams-admin-container">
          {filtered.length === 0 ? (
            <div className="empty-state"><p>Пока нет команд</p></div>
          ) : filtered.map(([tid, teams]) => {
            const t = allTournaments.find((x) => String(x.id) === tid);
            return (
              <div key={tid} className="tournament-section" style={{ marginBottom: 30 }}>
                <h3 style={{ marginBottom: 15 }}>{t?.title || `Турнир #${tid}`} - {t?.discipline || ''}</h3>
                {teams.map((team) => (
                  <div key={team.id} className="discipline-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 15, background: 'rgba(107, 45, 143, 0.2)', borderRadius: 8, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 5 }}>{team.name}</div>
                      <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>👥 {team.players} игроков</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-edit" onClick={() => setTeamModal({ open: true, team })}>Изменить</button>
                      <button className="btn-danger" onClick={() => handleDeleteTeam(team.id)}>Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Calendar tab
  const renderCalendar = () => (
    <div className="links-container">
      <div className="admin-header" style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ flex: 1, minWidth: 200 }}>Календарь активностей</h2>
      </div>
      <div className="calendar-wrapper-admin">
        <div className="calendar-filters">
          <DisciplineFilter selected={filterCalendar} onSelect={setFilterCalendar} colored />
        </div>
        <CalendarGrid
          events={calendarStore.events}
          currentDate={calendarStore.currentDate}
          selectedDiscipline={filterCalendar}
          disciplines={disciplineStore.disciplines}
          colorsMap={disciplineStore.colorsMap}
          registrationLinks={regLinks}
          onPrevMonth={() => { calendarStore.prevMonth(); setTimeout(() => calendarStore.fetchEvents(), 0); }}
          onNextMonth={() => { calendarStore.nextMonth(); setTimeout(() => calendarStore.fetchEvents(), 0); }}
        />
      </div>
    </div>
  );

  // Disciplines tab
  const renderDisciplines = () => (
    <div className="links-container">
      <h2>Управление дисциплинами</h2>
      <p className="hint">Добавляйте или удаляйте дисциплины. Редактируйте цвета.</p>
      <div className="form-group" style={{ maxWidth: 500, marginBottom: 20 }}>
        <label>Добавить новую дисциплину</label>
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
          <input type="text" id="new-discipline-input" placeholder="Название дисциплины" />
          <input type="color" id="new-discipline-color" defaultValue="#8b5abf" style={{ width: 60, height: 40, cursor: 'pointer', borderRadius: 4 }} />
          <button className="btn-primary" onClick={handleAddDiscipline}>Добавить</button>
        </div>
      </div>
      <div className="disciplines-list">
        {disciplineStore.disciplines.map((d) => (
          <div key={d.id} className="discipline-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 15, background: 'rgba(107, 45, 143, 0.2)', borderRadius: 8, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, flex: 1 }}>
              <div style={{ width: 30, height: 30, borderRadius: 4, background: d.color || '#8b5abf', border: `2px solid ${d.color || '#8b5abf'}` }} />
              <span style={{ fontSize: 16, fontWeight: 500 }}>{d.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-edit" onClick={() => setDisciplineModal({ open: true, discipline: d })}>Изменить</button>
              <button className="btn-danger" onClick={() => handleDeleteDiscipline(d.name)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Regulations tab
  const renderRegulations = () => (
    <div className="links-container">
      <h2>Управление регламентами</h2>
      <p className="hint">Загрузите PDF файлы с регламентами</p>
      <div className="admin-header" style={{ marginBottom: 20 }}>
        <button className="btn-primary" onClick={() => setRegulationModal({ open: true })}>+ Добавить регламент</button>
      </div>
      <div id="regulations-list">
        {regulationStore.regulations.length === 0 ? (
          <div className="empty-state"><p>Нет регламентов</p></div>
        ) : regulationStore.regulations.map((r) => (
          <div key={r.id} className="regulation-item">
            <div className="regulation-info">
              <h3>{r.discipline_name}{r.regulation_name ? ` - ${r.regulation_name}` : ''}</h3>
              <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" className="regulation-link">Открыть PDF</a>
            </div>
            <div className="regulation-actions" style={{ display: 'flex', gap: 10 }}>
              <button className="btn-edit" onClick={() => setRegulationModal({ open: true, regulation: r })}>Изменить</button>
              <button className="btn-danger" onClick={() => handleDeleteRegulation(r.id)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Handlers
  const handleArchive = async (t: Tournament) => {
    if (!confirm('Перенести турнир в архив?')) return;
    try {
      await tournamentStore.updateTournament({
        id: t.id, title: t.title, discipline: t.discipline, date: t.date,
        prize: t.prize, maxTeams: t.max_teams, customLink: t.custom_link,
        status: 'finished', winner: t.winner, watchUrl: t.watch_url, startTime: t.start_time,
      });
      alert('Турнир перенесен в архив!');
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const handleDeleteTournament = async (id: number) => {
    if (!confirm('Удалить турнир?')) return;
    try {
      await tournamentStore.removeTournament(id);
      alert('Турнир удален!');
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const handleDeleteTeam = async (id: number) => {
    if (!confirm('Удалить команду?')) return;
    try {
      await teamStore.removeTeam(id);
      clearCache('tournaments');
      await tournamentStore.fetchActive(true);
      alert('Команда удалена!');
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const handleAddDiscipline = async () => {
    const input = document.getElementById('new-discipline-input') as HTMLInputElement;
    const colorInput = document.getElementById('new-discipline-color') as HTMLInputElement;
    const name = input?.value.trim();
    if (!name) { alert('Введите название!'); return; }
    try {
      await disciplineStore.createDiscipline(name, colorInput?.value);
      if (input) input.value = '';
      alert(`Дисциплина "${name}" добавлена!`);
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const handleDeleteDiscipline = async (name: string) => {
    if (!confirm(`Удалить дисциплину "${name}"?`)) return;
    try {
      await disciplineStore.removeDiscipline(name);
      alert(`Дисциплина "${name}" удалена!`);
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const handleDeleteRegulation = async (id: number) => {
    if (!confirm('Удалить регламент?')) return;
    try {
      await regulationStore.removeRegulation(id);
      alert('Регламент удален!');
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const handleTournamentSubmit = async (data: any) => {
    try {
      if (data.id) {
        await tournamentStore.updateTournament(data);
        alert('Турнир обновлен!');
      } else {
        await tournamentStore.createTournament(data);
        alert('Турнир добавлен!');
      }
      setTournamentModal({ open: false });
      if (data.status === 'finished') await tournamentStore.fetchPast(true);
      else { await tournamentStore.fetchActive(true); calendarStore.fetchEvents(); }
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const handleTeamSubmit = async (data: any) => {
    try {
      if (data.id) {
        await teamStore.updateTeam(data);
        alert('Команда обновлена!');
      } else {
        await teamStore.createTeam(data);
        alert('Команда добавлена!');
      }
      setTeamModal({ open: false });
      clearCache('tournaments');
      await tournamentStore.fetchActive(true);
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const handleCalendarSubmit = async (data: any) => {
    try {
      if (data.id) {
        await calendarStore.updateEvent(data);
      } else {
        await calendarStore.createEvent(data);
      }
      setCalendarModal({ open: false });
      clearCache('tournaments');
      await tournamentStore.fetchActive(true);
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const handleRegulationSubmit = async (data: any) => {
    try {
      if (data.id) {
        await regulationStore.updateRegulation(data.id, data);
        alert('Регламент обновлен!');
      } else {
        await regulationStore.createRegulation(data);
        alert('Регламент добавлен!');
      }
      setRegulationModal({ open: false });
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const handleDisciplineSubmit = async (data: any) => {
    try {
      if (data.id) {
        await disciplineStore.updateDiscipline(data.id, { name: data.name, color: data.color });
        alert('Дисциплина обновлена!');
      }
      setDisciplineModal({ open: false });
    } catch (e) { alert('Ошибка: ' + (e instanceof Error ? e.message : e)); }
  };

  const tabContent: Record<TabName, () => React.ReactNode> = {
    active: renderActive,
    past: renderPast,
    teams: renderTeams,
    calendar: renderCalendar,
    disciplines: renderDisciplines,
    links: () => <LinksForm />,
    regulations: renderRegulations,
    social: () => <SocialForm />,
  };

  return (
    <>
      <div className="admin-header">
        <h1 className="page-title">Админ-панель</h1>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => switchTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content active">
        {tabContent[tab]()}
      </div>

      {/* Tournament Modal */}
      <Modal
        open={tournamentModal.open}
        onClose={() => setTournamentModal({ open: false })}
        title={tournamentModal.tournament ? 'Редактировать турнир' : (tournamentModal.isPast ? 'Добавить прошедший турнир' : 'Добавить турнир')}
        confirmClose
      >
        <TournamentForm
          key={tournamentModal.tournament?.id ?? 'new'}
          tournament={tournamentModal.tournament}
          isPast={tournamentModal.isPast}
          onSubmit={handleTournamentSubmit}
          onCancel={() => setTournamentModal({ open: false })}
        />
      </Modal>

      {/* Team Modal */}
      <Modal
        open={teamModal.open}
        onClose={() => setTeamModal({ open: false })}
        title={teamModal.team ? 'Редактировать команду' : 'Добавить команду'}
        confirmClose
      >
        <TeamForm
          key={teamModal.team?.id ?? 'new'}
          team={teamModal.team}
          onSubmit={handleTeamSubmit}
          onCancel={() => setTeamModal({ open: false })}
        />
      </Modal>

      {/* Calendar Event Modal */}
      <Modal
        open={calendarModal.open}
        onClose={() => setCalendarModal({ open: false })}
        title={calendarModal.event ? 'Изменить событие' : 'Добавить событие'}
        confirmClose
      >
        <CalendarEventForm
          key={calendarModal.event?.id ?? 'new'}
          event={calendarModal.event}
          defaultDate={calendarModal.defaultDate}
          onSubmit={handleCalendarSubmit}
          onCancel={() => setCalendarModal({ open: false })}
        />
      </Modal>

      {/* Regulation Modal */}
      <Modal
        open={regulationModal.open}
        onClose={() => setRegulationModal({ open: false })}
        title={regulationModal.regulation ? 'Редактировать регламент' : 'Добавить регламент'}
        confirmClose
      >
        <RegulationForm
          key={regulationModal.regulation?.id ?? 'new'}
          regulation={regulationModal.regulation}
          onSubmit={handleRegulationSubmit}
          onCancel={() => setRegulationModal({ open: false })}
        />
      </Modal>

      {/* Discipline Edit Modal */}
      <Modal
        open={disciplineModal.open}
        onClose={() => setDisciplineModal({ open: false })}
        title="Редактировать дисциплину"
        confirmClose
      >
        <DisciplineForm
          key={disciplineModal.discipline?.id ?? 'new'}
          discipline={disciplineModal.discipline}
          onSubmit={handleDisciplineSubmit}
          onCancel={() => setDisciplineModal({ open: false })}
        />
      </Modal>
    </>
  );
}
