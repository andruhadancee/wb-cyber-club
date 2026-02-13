import { RouterProvider } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'dayjs/locale/ru';
import { ThemeProvider } from '@/shared/theme';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog/ConfirmDialog';
import { ErrorBoundary } from '@/shared/ui/error-boundary/ErrorBoundary';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,   // 2 min — same as old localStorage cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <SnackbarProvider
              maxSnack={3}
              autoHideDuration={3000}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <RouterProvider router={router} />
              <ConfirmDialog />
            </SnackbarProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
