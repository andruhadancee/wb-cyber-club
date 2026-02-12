import { RouterProvider } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/ru';
import { ThemeProvider } from '@/shared/theme';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog/ConfirmDialog';
import { router } from './router';

export function App() {
  return (
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
  );
}
