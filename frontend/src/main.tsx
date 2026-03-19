import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorReporting } from "./services/errorReporting";

// Initialize error reporting for proactive customer support
initErrorReporting();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, notify user if needed
                console.log('[SW] New content available');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('[SW] Registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
