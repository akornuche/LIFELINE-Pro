import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref([]);
  const unreadCount = ref(0);

  // Actions
  function addNotification(notification) {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    notifications.value.unshift(newNotification);
    unreadCount.value++;
  }

  function markAsRead(id) {
    const notification = notifications.value.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      unreadCount.value--;
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(n => {
      n.read = true;
    });
    unreadCount.value = 0;
  }

  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      if (!notifications.value[index].read) {
        unreadCount.value--;
      }
      notifications.value.splice(index, 1);
    }
  }

  function clearAll() {
    notifications.value = [];
    unreadCount.value = 0;
  }

  return {
    // State
    notifications,
    unreadCount,
    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };
}, {
  persist: true
});
