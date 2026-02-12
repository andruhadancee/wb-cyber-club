import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/widgets/layout/AppLayout';
import { TournamentsPage } from '@/pages/tournaments/TournamentsPage';
import { TeamsPage } from '@/pages/teams/TeamsPage';
import { ArchivePage } from '@/pages/archive/ArchivePage';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { RegulationsPage } from '@/pages/regulations/RegulationsPage';
import { AdminPage } from '@/pages/admin/AdminPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <TournamentsPage /> },
      { path: '/teams', element: <TeamsPage /> },
      { path: '/archive', element: <ArchivePage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/regulations', element: <RegulationsPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
]);
