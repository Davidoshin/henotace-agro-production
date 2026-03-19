import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, X, Sparkles, ExternalLink } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { APP_VERSION, APP_VERSION_CODE, VERSION_CHECK_URL, APP_DOWNLOAD_URL, VersionInfo } from '@/config/version';

interface UpdateNotificationProps {
  onDismiss?: () => void;
}

export default function UpdateNotification({ onDismiss }: UpdateNotificationProps) {
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      setChecking(true);
      
      // Check if we've already dismissed this version today
      const dismissedVersion = localStorage.getItem('dismissedUpdateVersion');
      const dismissedDate = localStorage.getItem('dismissedUpdateDate');
      const today = new Date().toDateString();
      
      if (dismissedVersion && dismissedDate === today) {
        setDismissed(true);
        setChecking(false);
        return;
      }

      const response = await fetch(VERSION_CHECK_URL);
      
      if (response.ok) {
        const data: VersionInfo = await response.json();
        
        // Compare version codes (number comparison is more reliable)
        if (data.versionCode > APP_VERSION_CODE) {
          setUpdateInfo(data);
        }
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.log('Version check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleUpdate = async () => {
    const url = updateInfo?.downloadUrl || APP_DOWNLOAD_URL;
    
    try {
      // Open download page in browser
      await Browser.open({ 
        url,
        presentationStyle: 'popover'
      });
    } catch (error) {
      // Fallback to window.location for web
      window.open(url, '_blank');
    }
  };

  const handleDismiss = () => {
    // Remember dismissal for today
    if (updateInfo) {
      localStorage.setItem('dismissedUpdateVersion', updateInfo.version);
      localStorage.setItem('dismissedUpdateDate', new Date().toDateString());
    }
    setDismissed(true);
    onDismiss?.();
  };

  // Don't render anything while checking or if no update
  if (checking || !updateInfo || dismissed) {
    return null;
  }

  // If force update, show a modal-like overlay
  if (updateInfo.forceUpdate) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="max-w-md w-full animate-in fade-in zoom-in duration-300">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto">
                <Download className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Update Required</h2>
                <Badge className="mt-2 bg-green-100 text-green-700">v{updateInfo.version}</Badge>
              </div>
              <p className="text-muted-foreground">
                A new version of Henotace Business is available. Please update to continue using the app.
              </p>
              {updateInfo.releaseNotes && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-left">
                  <p className="font-medium mb-1">What's new:</p>
                  <p className="text-muted-foreground">{updateInfo.releaseNotes}</p>
                </div>
              )}
              <Button 
                onClick={handleUpdate} 
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Optional update - show as a banner
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  Update Available
                </h3>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  v{updateInfo.version}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {updateInfo.releaseNotes || 'A new version with improvements is available'}
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={handleUpdate}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Update Now
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-muted-foreground"
                >
                  Later
                </Button>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export a hook for programmatic version checking
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const response = await fetch(VERSION_CHECK_URL);
        if (response.ok) {
          const data: VersionInfo = await response.json();
          if (data.versionCode > APP_VERSION_CODE) {
            setUpdateAvailable(true);
            setLatestVersion(data);
          }
        }
      } catch (error) {
        console.log('Version check failed');
      }
    };

    check();
  }, []);

  return { updateAvailable, latestVersion, currentVersion: APP_VERSION };
}
