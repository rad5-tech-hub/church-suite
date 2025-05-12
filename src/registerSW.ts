import { registerSW } from 'virtual:pwa-register';

// Register the service worker with enhanced lifecycle callbacks
const updateSW = registerSW({
  // Called when new content is available
  onNeedRefresh() {
    const shouldRefresh = confirm('A new version of ChurchSuite is available. Would you like to refresh now?');
    if (shouldRefresh) {
      updateSW(true);
    }
  },

  // Called when the app is ready to work offline
  onOfflineReady() {
    console.log('ChurchSuite is now ready to work offline.');
  },

  // Called when the service worker is successfully registered
  onRegisteredSW(swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) {
    console.log('Service Worker registered at:', swScriptUrl);
    if (registration) {
      console.log('Service Worker registration successful:', registration);
    } else {
      console.log('No active Service Worker registration found.');
    }
  },

  // Called if service worker registration fails
  onRegisterError(error: unknown) {
    console.error('Service Worker registration failed:', error);
  },
});

export default updateSW;