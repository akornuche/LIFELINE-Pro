import { ref } from 'vue';

const toasts = ref([]);
let nextId = 0;

export function useToast() {
  const addToast = (message, type = 'success', duration = 3000) => {
    const id = nextId++;
    const toast = {
      id,
      message,
      type, // success, error, warning, info
      duration,
      visible: true
    };

    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value[index].visible = false;
      setTimeout(() => {
        toasts.value.splice(index, 1);
      }, 300); // Wait for fade out animation
    }
  };

  const success = (message, duration) => addToast(message, 'success', duration);
  const error = (message, duration) => addToast(message, 'error', duration);
  const warning = (message, duration) => addToast(message, 'warning', duration);
  const info = (message, duration) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
}
