import { enqueueSnackbar, type VariantType } from 'notistack';

export function showSuccess(message: string) {
  enqueueSnackbar(message, { variant: 'success' });
}

export function showError(message: string) {
  enqueueSnackbar(message, { variant: 'error' });
}

export function showWarning(message: string) {
  enqueueSnackbar(message, { variant: 'warning' });
}

export function showInfo(message: string) {
  enqueueSnackbar(message, { variant: 'info' });
}

export function showToast(message: string, variant: VariantType = 'default') {
  enqueueSnackbar(message, { variant });
}
