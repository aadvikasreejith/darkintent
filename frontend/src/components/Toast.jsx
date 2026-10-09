import { useOpportunities } from '../context/useOpportunities';
import { IconCheck, IconAlertCircle, IconClose } from './Icons';

export function ToastContainer() {
  const { toasts, dismissToast } = useOpportunities();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'error' ? <IconAlertCircle size={15} /> : <IconCheck size={15} />}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button
            type="button"
            className="toast-close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss toast"
          >
            <IconClose size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
