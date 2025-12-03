import { ref } from 'vue';

const isOpen = ref(false);
const config = ref({
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'warning', // warning, danger, info
  onConfirm: () => {},
  onCancel: () => {}
});

export function useConfirm() {
  const confirm = (options) => {
    return new Promise((resolve) => {
      config.value = {
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to continue?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'warning',
        onConfirm: () => {
          isOpen.value = false;
          resolve(true);
        },
        onCancel: () => {
          isOpen.value = false;
          resolve(false);
        }
      };
      isOpen.value = true;
    });
  };

  const close = () => {
    isOpen.value = false;
  };

  return {
    isOpen,
    config,
    confirm,
    close
  };
}
