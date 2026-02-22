import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/widgets/layout/AppLayout';
import { Loader } from '@/shared/ui/loader/Loader';

// Lazy-loaded pages — каждая страница загружается по требованию
const TournamentsPage = lazy(() =>
  import('@/pages/tournaments/TournamentsPage').then((m) => ({ default: m.TournamentsPage })),
);
const TeamsPage = lazy(() =>
  import('@/pages/teams/TeamsPage').then((m) => ({ default: m.TeamsPage })),
);
const ArchivePage = lazy(() =>
  import('@/pages/archive/ArchivePage').then((m) => ({ default: m.ArchivePage })),
);
const CalendarPage = lazy(() =>
  import('@/pages/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);
const RegulationsPage = lazy(() =>
  import('@/pages/regulations/RegulationsPage').then((m) => ({ default: m.RegulationsPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/not-found/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const BracketPage = lazy(() =>
  import('@/pages/bracket/BracketPage').then((m) => ({ default: m.BracketPage })),
);
const AdminPage = lazy(() =>
  import('@/pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <SuspenseWrapper><TournamentsPage /></SuspenseWrapper> },
      { path: '/teams', element: <SuspenseWrapper><TeamsPage /></SuspenseWrapper> },
      { path: '/archive', element: <SuspenseWrapper><ArchivePage /></SuspenseWrapper> },
      { path: '/calendar', element: <SuspenseWrapper><CalendarPage /></SuspenseWrapper> },
      { path: '/regulations', element: <SuspenseWrapper><RegulationsPage /></SuspenseWrapper> },
      { path: '/tournament/:id/bracket', element: <SuspenseWrapper><BracketPage /></SuspenseWrapper> },
      { path: '*', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
    ],
  },
  {
    path: '/admin',
    element: <SuspenseWrapper><AdminPage /></SuspenseWrapper>,
  },
]);
