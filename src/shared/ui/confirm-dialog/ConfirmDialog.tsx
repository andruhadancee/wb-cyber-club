import { create } from 'zustand';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { alpha, useTheme } from '@mui/material/styles';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

interface ConfirmActions {
  show: (options: {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  hide: () => void;
}

export const useConfirmStore = create<ConfirmState & ConfirmActions>((set) => ({
  open: false,
  title: 'Подтверждение',
  message: '',
  confirmLabel: 'Да',
  cancelLabel: 'Отмена',
  onConfirm: null,
  onCancel: null,
  show: ({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) =>
    set({
      open: true,
      title: title ?? 'Подтверждение',
      message,
      confirmLabel: confirmLabel ?? 'Да',
      cancelLabel: cancelLabel ?? 'Отмена',
      onConfirm,
      onCancel: onCancel ?? null,
    }),
  hide: () => set({ open: false, onConfirm: null, onCancel: null }),
}));

/** Глобальный confirm-диалог. Рендерится один раз в корне приложения. */
export function ConfirmDialog() {
  const { open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, hide } =
    useConfirmStore();
  const theme = useTheme();

  const handleCancel = () => {
    onCancel?.();
    hide();
  };

  const handleConfirm = () => {
    onConfirm?.();
    hide();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.error.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.5,
          }}
        >
          <HelpOutlineIcon sx={{ fontSize: 28, color: 'error.main' }} />
        </Box>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2.5, gap: 1 }}>
        <Button onClick={handleCancel} sx={{ minWidth: 100 }}>
          {cancelLabel}
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained" sx={{ minWidth: 100 }}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Утилита для показа confirm-диалога */
export function showConfirm(options: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  useConfirmStore.getState().show(options);
}
