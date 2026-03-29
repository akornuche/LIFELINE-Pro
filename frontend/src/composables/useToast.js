import { toast } from 'vue3-toastify';

export function useToast() {
  const success = (message, options = {}) => toast.success(message, { ...options });
  const error = (message, options = {}) => toast.error(message, { ...options });
  const warning = (message, options = {}) => toast.warning(message, { ...options });
  const info = (message, options = {}) => toast.info(message, { ...options });

  return {
    success,
    error,
    warning,
    info,
    // Provide compatibility for any legacy code still looking for these
    addToast: (msg, type) => toast[type || 'info'](msg),
    toasts: [] // Empty array for legacy compatibility
  };
}
