import { ref, computed, onMounted } from 'vue';

export function usePwa() {
  const isInstalled = ref(false);
  const canInstall = ref(false);
  const isOnline = ref(navigator.onLine);
  const needsUpdate = ref(false);
  let deferredPrompt = null;
  let updateSW = null;

  // Check if app is installed
  const checkInstalled = () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true;
      return true;
    }
    if (window.navigator.standalone) {
      isInstalled.value = true;
      return true;
    }
    return false;
  };

  // Prompt installation
  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available');
      return { outcome: 'unavailable' };
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`Install prompt outcome: ${outcome}`);
    
    if (outcome === 'accepted') {
      canInstall.value = false;
    }
    
    deferredPrompt = null;
    return { outcome };
  };

  // Update app
  const updateApp = () => {
    if (updateSW) {
      updateSW(true);
    } else {
      window.location.reload();
    }
  };

  // Check for updates manually
  const checkForUpdates = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('Checked for updates');
      }
    }
  };

  // Share content
  const share = async (data) => {
    if (!navigator.share) {
      console.warn('Web Share API not supported');
      return { success: false, error: 'not_supported' };
    }

    try {
      await navigator.share({
        title: data.title || 'LifeLine Pro',
        text: data.text || 'Check out LifeLine Pro',
        url: data.url || window.location.href
      });
      return { success: true };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'cancelled' };
      }
      console.error('Share failed:', error);
      return { success: false, error: error.message };
    }
  };

  // Get app badge count (for notifications)
  const setBadge = (count = 0) => {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count);
      } else {
        navigator.clearAppBadge();
      }
    }
  };

  // Clear badge
  const clearBadge = () => {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge();
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      return { granted: false, error: 'not_supported' };
    }

    if (Notification.permission === 'granted') {
      return { granted: true };
    }

    if (Notification.permission === 'denied') {
      return { granted: false, error: 'denied' };
    }

    const permission = await Notification.requestPermission();
    return { granted: permission === 'granted' };
  };

  // Show notification
  const showNotification = async (title, options = {}) => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        ...options
      });
    } else {
      new Notification(title, options);
    }
  };

  // Get installation stats
  const getStats = () => {
    return {
      isInstalled: isInstalled.value,
      canInstall: canInstall.value,
      isOnline: isOnline.value,
      needsUpdate: needsUpdate.value,
      notificationPermission: 'Notification' in window ? Notification.permission : 'not_supported',
      hasServiceWorker: 'serviceWorker' in navigator,
      hasShare: 'share' in navigator,
      hasBadge: 'setAppBadge' in navigator
    };
  };

  // Computed properties
  const displayMode = computed(() => {
    if (isInstalled.value) return 'standalone';
    return 'browser';
  });

  const canShare = computed(() => 'share' in navigator);
  const canNotify = computed(() => 'Notification' in window && Notification.permission === 'granted');

  // Initialize
  onMounted(() => {
    // Check installed status
    checkInstalled();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      canInstall.value = true;
      console.log('Install prompt available');
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      isInstalled.value = true;
      canInstall.value = false;
      deferredPrompt = null;
    });

    // Listen for online/offline
    window.addEventListener('online', () => {
      isOnline.value = true;
      console.log('App is online');
    });

    window.addEventListener('offline', () => {
      isOnline.value = false;
      console.log('App is offline');
    });

    // Listen for SW updates
    document.addEventListener('swUpdated', (event) => {
      console.log('Service worker updated');
      needsUpdate.value = true;
      updateSW = event.detail;
    });

    // Check for updates on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    });
  });

  return {
    // State
    isInstalled,
    canInstall,
    isOnline,
    needsUpdate,
    displayMode,
    canShare,
    canNotify,

    // Methods
    promptInstall,
    updateApp,
    checkForUpdates,
    share,
    setBadge,
    clearBadge,
    requestNotificationPermission,
    showNotification,
    getStats
  };
}
