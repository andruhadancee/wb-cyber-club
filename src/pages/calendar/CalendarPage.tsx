import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCalendarStore } from '@/entities/calendar-event/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { linksApi, type RegistrationLinks } from '@/shared/api/linksApi';
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { CalendarGrid } from '@/widgets/calendar-grid/CalendarGrid';

export function CalendarPage() {
  const { hideLoader } = useOutletContext<{ hideLoader: () => void }>();
  const calendarStore = useCalendarStore();
  const disciplineStore = useDisciplineStore();
  const [selected, setSelected] = useState('all');
  const [links, setLinks] = useState<RegistrationLinks>({});

  useEffect(() => {
    Promise.all([
      calendarStore.fetchEvents(),
      disciplineStore.fetchAll(),
      linksApi.getAll().then(setLinks),
    ]).finally(hideLoader);
  }, [hideLoader]);

  return (
    <div className="calendar-wrapper">
      <div className="calendar-filters">
        <DisciplineFilter selected={selected} onSelect={setSelected} colored />
      </div>
      <div className="calendar-grid-container">
        <CalendarGrid
          events={calendarStore.events}
          currentDate={calendarStore.currentDate}
          selectedDiscipline={selected}
          disciplines={disciplineStore.disciplines}
          colorsMap={disciplineStore.colorsMap}
          registrationLinks={links}
          onPrevMonth={() => { calendarStore.prevMonth(); setTimeout(() => calendarStore.fetchEvents(), 0); }}
          onNextMonth={() => { calendarStore.nextMonth(); setTimeout(() => calendarStore.fetchEvents(), 0); }}
        />
      </div>
    </div>
  );
}
