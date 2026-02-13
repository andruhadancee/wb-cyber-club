import { useCallback, useState, type ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Slide from '@mui/material/Slide';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';
import type { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';

const SlideTransition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** If true — always confirm. If a function — confirm only when it returns true (e.g. form isDirty). */
  confirmClose?: boolean | (() => boolean);
  confirmMessage?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  actions?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  confirmClose = false,
  confirmMessage = 'Вы уверены? Несохранённые данные будут потеряны.',
  maxWidth = 'sm',
  actions,
}: ModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const theme = useTheme();

  const handleClose = useCallback(() => {
    const shouldConfirm = typeof confirmClose === 'function' ? confirmClose() : confirmClose;
    if (shouldConfirm) {
      setConfirmOpen(true);
    } else {
      onClose();
    }
  }, [onClose, confirmClose]);

  const handleConfirm = useCallback(() => {
    setConfirmOpen(false);
    onClose();
  }, [onClose]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={maxWidth}
        fullWidth
        scroll="paper"
        TransitionComponent={SlideTransition}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pr: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" component="span" fontWeight={700}>
            {title}
          </Typography>
          <IconButton
            onClick={handleClose}
            aria-label="Закрыть"
            sx={{
              transition: 'all 0.2s ease',
              '&:hover': {
                color: 'error.main',
                transform: 'rotate(90deg)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>{children}</DialogContent>
        {actions && <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions>}
      </Dialog>

      {/* Confirm close dialog */}
      <Dialog open={confirmOpen} onClose={handleCancelConfirm} maxWidth="xs">
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1,
            }}
          >
            <WarningAmberIcon sx={{ color: 'warning.main' }} />
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Подтверждение
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography color="text.secondary">{confirmMessage}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2.5 }}>
          <Button onClick={handleCancelConfirm} sx={{ minWidth: 100 }}>
            Остаться
          </Button>
          <Button onClick={handleConfirm} color="error" variant="contained" sx={{ minWidth: 100 }}>
            Выйти
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
