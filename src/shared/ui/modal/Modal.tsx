import { useEffect, useCallback, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Запрашивать подтверждение при закрытии (клик вне / Escape) */
  confirmClose?: boolean;
  /** Текст подтверждения (по умолчанию: "Вы уверены? Несохранённые данные будут потеряны.") */
  confirmMessage?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  confirmClose = false,
  confirmMessage = 'Вы уверены? Несохранённые данные будут потеряны.',
}: ModalProps) {
  const safeClose = useCallback(() => {
    if (confirmClose) {
      if (window.confirm(confirmMessage)) onClose();
    } else {
      onClose();
    }
  }, [onClose, confirmClose, confirmMessage]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') safeClose();
    };
    document.body.classList.add('modal-open');
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, safeClose]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) safeClose();
  };

  return (
    <div className="modal active" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={safeClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
