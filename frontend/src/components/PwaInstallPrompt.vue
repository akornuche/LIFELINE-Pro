<template>
  <transition name="slide-up">
    <div v-if="showPrompt" class="pwa-install-prompt">
      <div class="prompt-content">
      <div class="prompt-header">
        <div class="app-icon">
          <div class="icon-placeholder">📱</div>
        </div>
        <div class="app-info">
          <h3>Install LifeLine Pro</h3>
          <p>Get quick access to your health services</p>
        </div>
        <button @click="dismiss" class="close-btn" aria-label="Close">
          ×
        </button>
      </div>        <div class="prompt-features">
          <div class="feature">
            <span class="feature-icon">⚡</span>
            <span>Fast & Lightweight</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📱</span>
            <span>Works Offline</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🔔</span>
            <span>Instant Updates</span>
          </div>
        </div>

        <div class="prompt-actions">
          <button @click="dismiss" class="btn-secondary">
            Not Now
          </button>
          <button @click="install" class="btn-primary">
            Install App
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const showPrompt = ref(false);
let deferredPrompt = null;

onMounted(() => {
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App is already installed');
    return;
  }

  // Check if user previously dismissed
  const dismissed = localStorage.getItem('pwa-prompt-dismissed');
  if (dismissed) {
    const dismissedDate = new Date(dismissed);
    const daysSinceDismissal = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissal < 7) {
      console.log('User dismissed prompt recently');
      return;
    }
  }

  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show prompt after 3 seconds
    setTimeout(() => {
      showPrompt.value = true;
    }, 3000);
  });

  // Listen for app installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    showPrompt.value = false;
    deferredPrompt = null;
    
    // Track installation
    if (window.gtag) {
      window.gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'PWA Installation'
      });
    }
  });
});

const install = async () => {
  if (!deferredPrompt) {
    console.log('No install prompt available');
    return;
  }

  // Show install prompt
  deferredPrompt.prompt();

  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response: ${outcome}`);

  // Track outcome
  if (window.gtag) {
    window.gtag('event', 'pwa_install_prompt', {
      event_category: 'engagement',
      event_label: outcome
    });
  }

  // Reset
  deferredPrompt = null;
  showPrompt.value = false;
};

const dismiss = () => {
  showPrompt.value = false;
  localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  
  // Track dismissal
  if (window.gtag) {
    window.gtag('event', 'pwa_install_dismissed', {
      event_category: 'engagement',
      event_label: 'User dismissed install prompt'
    });
  }
};
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 16px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
}

@media (min-width: 768px) {
  .pwa-install-prompt {
    bottom: 20px;
    left: 20px;
    right: auto;
    max-width: 400px;
    border-radius: 16px;
  }
}

.prompt-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.prompt-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.app-icon {
  flex-shrink: 0;
}

.icon-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-info {
  flex: 1;
}

.app-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.app-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  font-size: 28px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #374151;
}

.prompt-features {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #f9fafb;
}

.feature {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #4b5563;
  text-align: center;
}

.feature-icon {
  font-size: 24px;
}

.prompt-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #10b981;
  color: white;
}

.btn-primary:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Animations */
.slide-up-enter-active {
  animation: slideUp 0.3s ease-out;
}

.slide-up-leave-active {
  animation: slideDown 0.3s ease-in;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}
</style>
