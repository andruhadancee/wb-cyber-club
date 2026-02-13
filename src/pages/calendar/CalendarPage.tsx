import { useEffect, useState, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useCalendarStore } from '@/entities/calendar-event/model';
import { useDisciplineStore } from '@/entities/discipline/model';
import { linksApi, type RegistrationLinks } from '@/shared/api/linksApi';
import { DisciplineFilter } from '@/features/discipline-filter/DisciplineFilter';
import { CalendarGrid } from '@/widgets/calendar-grid/CalendarGrid';
import { Loader } from '@/shared/ui/loader/Loader';
import { pageEntrance } from '@/shared/lib/animations';

export function CalendarPage() {
  const calendarStore = useCalendarStore();
  const disciplineStore = useDisciplineStore();
  const [selected, setSelected] = useState('all');
  const [links, setLinks] = useState<RegistrationLinks>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    linksApi.getAll().then(setLinks).finally(() => setReady(true));
  }, []);

  const handlePrevMonth = useCallback(() => {
    calendarStore.prevMonth();
  }, [calendarStore]);

  const handleNextMonth = useCallback(() => {
    calendarStore.nextMonth();
  }, [calendarStore]);

  if (!ready) return <Loader />;

  return (
    <Box sx={pageEntrance}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Календарь событий
      </Typography>
      <DisciplineFilter selected={selected} onSelect={setSelected} colored />
      <CalendarGrid
        events={calendarStore.events}
        currentDate={calendarStore.currentDate}
        selectedDiscipline={selected}
        disciplines={disciplineStore.disciplines}
        colorsMap={disciplineStore.colorsMap}
        registrationLinks={links}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />
    </Box>
  );
}
