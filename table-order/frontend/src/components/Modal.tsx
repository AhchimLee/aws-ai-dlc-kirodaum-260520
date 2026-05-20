interface ModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, title, message, confirmText = '확인', cancelText = '취소', danger, onConfirm, onCancel }: ModalProps) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontSize: 17, marginBottom: 8 }}>{title}</h3>
        <p style={{ color: 'var(--color-gray-600)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} className="btn-ghost" style={{ flex: 1 }}>{cancelText}</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'} style={{ flex: 1 }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
