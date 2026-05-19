import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initErrorReporting } from "./services/errorReporting";
import { initializeOfflineSync } from "./lib/api";

// Suppress known Radix UI React.forwardRef warning in development
// This is a known issue with Radix UI and doesn't affect functionality
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = function(...args: any[]) {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Function components cannot be given refs')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

// Initialize error reporting for proactive customer support
initErrorReporting();
initializeOfflineSync();

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
