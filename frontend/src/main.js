import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import Vue3Toastify from 'vue3-toastify';
import App from './App.vue';
import router from './router';

import './assets/styles/main.css';
import 'vue3-toastify/dist/index.css';

// Create Vue app
const app = createApp(App);

// Setup Pinia with persistence
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// Register plugins
app.use(pinia);
app.use(router);
app.use(Vue3Toastify, {
  autoClose: 3000,
  position: 'top-right',
  theme: 'colored',
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
});

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err);
  console.error('Error info:', info);
};

// Mount app
app.mount('#app');

// PWA: Register Service Worker with auto-update
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('New content available, please refresh.');
        // Show update notification to user
        if (confirm('New version available! Reload to update?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
      onRegistered(registration) {
        console.log('Service Worker registered:', registration);
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      },
      onRegisterError(error) {
        console.error('SW registration error:', error);
      }
    });
  });
}

// PWA: Handle app installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Show install button/banner to user
  console.log('App can be installed');
});

window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  deferredPrompt = null;
});

// PWA: Handle app updates
document.addEventListener('swUpdated', (event) => {
  const registration = event.detail;
  if (confirm('New version available! Load new version?')) {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
});

// PWA: Monitor online/offline status
window.addEventListener('online', () => {
  console.log('App is online');
});

window.addEventListener('offline', () => {
  console.log('App is offline');
});
