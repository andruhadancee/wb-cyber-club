import { useMemo, useState, useCallback } from 'react';
import { getDisciplineColor } from '@/shared/lib/discipline-colors';
import { getDisciplineIconUrl } from '@/shared/lib/discipline-icons';
import { formatLocalDate } from '@/shared/lib/date';
import { useInterval } from '@/shared/hooks/useInterval';
import { TournamentButton } from '@/features/tournament-button/TournamentButton';
import { Modal } from '@/shared/ui/modal/Modal';
import type { CalendarEvent } from '@/entities/calendar-event/types';
import type { Discipline } from '@/entities/discipline/types';

interface Props {
  events: CalendarEvent[];
  currentDate: Date;
  selectedDiscipline: string;
  disciplines: Discipline[];
  colorsMap: Record<string, string | null>;
  registrationLinks: Record<string, string>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function deduplicateEvents(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = e.tournament_id
      ? `tournament_${e.tournament_id}`
      : `${e.title}_${(e.event_date).slice(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isTournamentActive(event: CalendarEvent): boolean {
  if (!event.start_time) return false;
  try {
    const dateStr = (event.event_date).slice(0, 10);
    const [year, month, day] = dateStr.split('-').map(Number);
    const m = event.start_time.match(/(\d{1,2}):(\d{2})/);
    if (!m) return false;
    const start = new Date(year, month - 1, day, +m[1], +m[2], 0);
    return Date.now() >= start.getTime();
  } catch {
    return false;
  }
}

export function CalendarGrid({
  events,
  currentDate,
  selectedDiscipline,
  disciplines,
  colorsMap,
  registrationLinks,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useInterval(() => setTick((t) => t + 1), 60000);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const filteredEvents = useMemo(() => {
    let f = events;
    if (selectedDiscipline !== 'all') {
      f = f.filter((e) => e.discipline === selectedDiscipline);
    }
    return deduplicateEvents(f);
  }, [events, selectedDiscipline]);

  const allEventsDeduped = useMemo(() => deduplicateEvents(events), [events]);

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const title = currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  const modalEvents = useMemo(() => {
    if (!modalDate) return [];
    return allEventsDeduped.filter((e) => (e.event_date).slice(0, 10) === modalDate);
  }, [modalDate, allEventsDeduped]);

  const getRegLink = useCallback(
    (event: CalendarEvent): string => {
      if (event.custom_link?.trim()) return event.custom_link.trim();
      if (event.registration_link?.trim()) return event.registration_link.trim();
      if (event.discipline && registrationLinks[event.discipline]) {
        return registrationLinks[event.discipline];
      }
      return '#';
    },
    [registrationLinks],
  );

  return (
    <>
      <div className="calendar-controls" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16, padding: '8px 0 12px' }}>
        <button className="calendar-nav-btn" onClick={onPrevMonth} aria-label="Предыдущий месяц">◀</button>
        <div className="calendar-month">{title}</div>
        <button className="calendar-nav-btn" onClick={onNextMonth} aria-label="Следующий месяц">▶</button>
      </div>

      <div className="calendar-grid">
        {weekdays.map((w) => (
          <div key={w} style={{ color: 'var(--color-text-secondary)', fontWeight: 700 }}>
            {w}
          </div>
        ))}

        {Array.from({ length: startOffset }, (_, i) => (
          <div key={`empty-${i}`} className="calendar-cell calendar-empty" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = formatLocalDate(year, month, day);
          const dayEventsFiltered = filteredEvents.filter(
            (e) => (e.event_date).slice(0, 10) === dateStr,
          );

          const uniqueDisciplines = [
            ...new Set(
              events
                .filter((e) => (e.event_date).slice(0, 10) === dateStr && e.discipline)
                .map((e) => e.discipline!),
            ),
          ];

          const isActive = dayEventsFiltered.length > 0 && isTournamentActive(dayEventsFiltered[0]);
          const hasEvents = dayEventsFiltered.length > 0;

          let borderStyle: React.CSSProperties = {};
          if (hasEvents) {
            if (uniqueDisciplines.length === 1) {
              const color = getDisciplineColor(uniqueDisciplines[0], colorsMap[uniqueDisciplines[0]]);
              borderStyle = { borderColor: color, borderWidth: 2 };
              if (isActive) borderStyle.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            } else if (uniqueDisciplines.length > 1) {
              borderStyle = { borderColor: 'transparent', borderWidth: 0, backgroundColor: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(45, 27, 61, 0.25)' };
            }
          }

          return (
            <div
              key={day}
              className={`calendar-cell${hasEvents ? ' calendar-has-events' : ''}`}
              style={borderStyle}
              onClick={() => setModalDate(dateStr)}
            >
              <div className="calendar-date-num">{day}</div>
              {hasEvents && (
                <>
                  <div className="calendar-discipline-icons">
                    {uniqueDisciplines.map((d) => {
                      const url = getDisciplineIconUrl(d, disciplines.find((dd) => dd.name === d)?.logo_url);
                      return (
                        <div key={d} className="calendar-discipline-icon">
                          {url ? (
                            <img src={url} className="discipline-icon" alt={d} />
                          ) : (
                            <span className="discipline-icon discipline-icon-emoji">🎮</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="calendar-events-text">
                    {dayEventsFiltered.slice(0, 2).map((e) => {
                      const color = e.discipline ? getDisciplineColor(e.discipline, colorsMap[e.discipline ?? '']) : '#8b5abf';
                      const shortTitle = e.title.length > 15 ? e.title.substring(0, 15) + '...' : e.title;
                      return (
                        <div key={e.id} className="calendar-event-item" style={{ color }}>
                          {shortTitle}
                        </div>
                      );
                    })}
                    {dayEventsFiltered.length > 2 && (
                      <div className="calendar-event-more">+{dayEventsFiltered.length - 2}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={modalDate !== null}
        onClose={() => setModalDate(null)}
        title={modalEvents.length > 0 ? `События — ${modalDate}` : `Событий нет — ${modalDate}`}
      >
        {modalEvents.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>
            На этот день пока ничего не запланировано.
          </p>
        ) : (
          <div className="calendar-events-wrap">
            {modalEvents.map((e) => {
              const regLink = getRegLink(e);
              return (
                <div key={e.id} className="calendar-event-card">
                  {e.image_url && (
                    <img className="calendar-event-img" src={e.image_url} alt={e.title} />
                  )}
                  <div className="calendar-event-content">
                    <h3>{e.title}</h3>
                    {e.discipline && (
                      <div
                        className="calendar-event-discipline"
                        style={{ color: getDisciplineColor(e.discipline, colorsMap[e.discipline]) }}
                      >
                        {e.discipline}
                      </div>
                    )}
                    {e.prize && <div className="calendar-event-prize">Призовой фонд: {e.prize}</div>}
                    {e.start_time && (
                      <div className="calendar-event-time">
                        Время старта: {e.start_time.split(':').slice(0, 2).join(':')} МСК
                      </div>
                    )}
                    {e.description && <div className="calendar-event-desc">{e.description}</div>}
                    {e.max_teams && (
                      <div className="calendar-event-teams">Команд: {e.max_teams}</div>
                    )}
                    <TournamentButton
                      date={(e.event_date).slice(0, 10)}
                      startTime={e.start_time}
                      regLink={regLink}
                      watchUrl={e.watch_url}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
