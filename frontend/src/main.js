import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import Vue3Toastify from 'vue3-toastify';
import App from './App.vue';
import router from './router';

import './assets/styles/main.css';
import 'vue3-toastify/dist/index.css';
// Self-hosted Inter font — no Google Fonts CDN needed
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';

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
  theme: 'light',
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

// PWA: Register Service Worker
// Update notifications use a toast banner — not confirm() which blocks the UI.
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        // Dispatch a custom event so App.vue can show a non-blocking banner
        window.dispatchEvent(new CustomEvent('pwa-needs-refresh'));
      },
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent('pwa-offline-ready'));
      },
      onRegistered(registration) {
        // Check for updates every hour
        setInterval(() => registration.update(), 60 * 60 * 1000);
      },
      onRegisterError(error) {
        console.error('SW registration error:', error);
      }
    });
  });
}
