import { useState, useEffect } from 'react';
import { X, Download, Monitor, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mobile app download URL
const MOBILE_APP_URL = 'https://business.henotaceai.ng/downloads/henotace-business-v1.0.36.apk';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
    };
    
    const isInStandaloneMode = checkStandalone();
    setIsStandalone(isInStandaloneMode);

    if (isInStandaloneMode) {
      return;
    }

    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);

    const checkAndroid = /Android/i.test(navigator.userAgent);
    setIsAndroid(checkAndroid);

    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(checkIOS);

    // For Android mobile users, show mobile app download prompt instead of PWA
    if (checkAndroid) {
      const dismissedAt = localStorage.getItem('mobile-app-prompt-dismissed');
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10);
        const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
        if (dismissedTime > threeDaysAgo) {
          return; // Don't show prompt if dismissed within 3 days
        }
      }
      setTimeout(() => setShowPrompt(true), 2000);
      return; // Skip PWA prompt setup for Android
    }

    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      if (dismissedTime > threeDaysAgo) {
        const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
          e.preventDefault();
          setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      }
    }

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      localStorage.removeItem('pwa-installed');
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (checkIOS && !isInStandaloneMode) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
      localStorage.removeItem('pwa-prompt-dismissed');
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      });

      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdatePrompt(true);
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true');
      localStorage.removeItem('pwa-prompt-dismissed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isAndroid) {
      localStorage.setItem('mobile-app-prompt-dismissed', Date.now().toString());
    } else {
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    }
  };

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdatePrompt(false);
      window.location.reload();
    }
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  if (showUpdatePrompt) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 shadow-lg">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <div>
              <p className="font-bold text-base">Update Available!</p>
              <p className="text-sm text-white/90">A new version of Henotace is ready.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleUpdate} size="sm" className="bg-white text-green-600 hover:bg-white/90 font-bold">
              Update Now
            </Button>
            <button onClick={handleDismissUpdate} className="p-1 hover:bg-white/20 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {isMobile ? (
        <div className="fixed inset-x-0 bottom-0 z-[100] animate-in slide-in-from-bottom duration-300">
          <div className="bg-gradient-to-br from-primary to-primary/90 text-white rounded-t-3xl shadow-2xl">
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-14 h-2 bg-white/40 rounded-full" />
            </div>
            <div className="px-6 pb-10 pt-4">
              <button onClick={handleDismiss} className="absolute top-5 right-5 p-2 hover:bg-white/20 rounded-full transition-colors" aria-label="Close">
                <X className="w-6 h-6" />
              </button>
              <div className="flex justify-center mb-5">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl">
                  <img src="/faviconlightmode.png" alt="Henotace" className="w-16 h-16" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-center mb-3">
                {isAndroid ? 'Download Our App' : 'Install Henotace'}
              </h3>
              <p className="text-white/90 text-center text-lg font-medium mb-8 leading-relaxed">
                {isAndroid 
                  ? 'Get the Henotace Business app for the best mobile experience with offline support and biometric login.'
                  : 'Add Henotace to your home screen for quick access and a better experience.'}
              </p>
              {isAndroid ? (
                <a 
                  href={MOBILE_APP_URL}
                  download="henotace-business-v1.0.36.apk"
                  className="w-full bg-white text-green-600 hover:bg-white/90 h-14 text-lg font-bold shadow-xl rounded-xl flex items-center justify-center gap-3"
                >
                  <Smartphone className="w-6 h-6" />
                  Download for Android
                </a>
              ) : isIOS ? (
                <div className="bg-white/15 rounded-2xl p-5 mb-5">
                  <p className="text-lg font-bold text-center mb-4">To install on iOS:</p>
                  <ol className="space-y-4">
                    <li className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-base font-bold shrink-0">1</span>
                      <span className="text-base font-medium">Tap the <strong>Share</strong> button below</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-base font-bold shrink-0">2</span>
                      <span className="text-base font-medium">Scroll and tap <strong>Add to Home Screen</strong></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-base font-bold shrink-0">3</span>
                      <span className="text-base font-medium">Tap <strong>Add</strong> to confirm</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <Button onClick={handleInstall} className="w-full bg-white text-primary hover:bg-white/90 h-14 text-lg font-bold shadow-xl rounded-xl">
                  <Download className="w-6 h-6 mr-3" />
                  Install App
                </Button>
              )}
              <button onClick={handleDismiss} className="w-full mt-4 text-white/80 hover:text-white text-base font-medium py-3 transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-card border-2 shadow-2xl rounded-2xl p-6 max-w-md">
            <button onClick={handleDismiss} className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full transition-colors" aria-label="Close">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <img src="/faviconlightmode.png" alt="Henotace" className="w-12 h-12" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-2">Install Henotace</h3>
                <p className="text-muted-foreground text-base mb-4">Install for quick access and offline features.</p>
                <div className="flex gap-3">
                  <Button onClick={handleInstall} className="gap-2 font-bold" disabled={!deferredPrompt}>
                    <Monitor className="w-5 h-5" />
                    Install
                  </Button>
                  <Button onClick={handleDismiss} variant="ghost" className="font-medium">
                    Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
