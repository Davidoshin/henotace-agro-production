import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiCall } from "@/lib/api";
import { 
  Shield, 
  Smartphone, 
  Key, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  Trash2
} from "lucide-react";

interface TwoFAStatus {
  is_enabled: boolean;
  created_at?: string;
  last_used?: string;
  backup_codes_count?: number;
}

interface TwoFASetup {
  qr_code: string;
  secret_key: string;
  backup_codes: string[];
}

export default function TwoFAManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [twofaStatus, setTwofaStatus] = useState<TwoFAStatus | null>(null);
  const [setupData, setSetupData] = useState<TwoFASetup | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const makeApiCall = async (path: string, options: RequestInit = {}) => {
    return await apiCall(path, options);
  };

  useEffect(() => {
    loadTwoFAStatus();
  }, []);

  const loadTwoFAStatus = async () => {
    try {
      setLoading(true);
      const data = await makeApiCall('/auth/2fa/status/');
      if (data.success) {
        setTwofaStatus(data);
      }
    } catch (error: any) {
      console.error('Error loading 2FA status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load 2FA status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupTwoFA = async () => {
    try {
      setLoading(true);
      const data = await makeApiCall('/auth/2fa/setup/', {
        method: 'POST'
      });
      if (data.success) {
        setSetupData({
          qr_code: data.qr_code,
          secret_key: data.secret_key,
          backup_codes: data.backup_codes || []
        });
        toast({
          title: "2FA Setup Started",
          description: "Scan the QR code with your authenticator app to continue setup.",
        });
      }
    } catch (error: any) {
      console.error('Error setting up 2FA:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to start 2FA setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFASetup = async () => {
    if (!verificationCode) {
      toast({
        title: "Code Required",
        description: "Please enter the verification code from your authenticator app.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const data = await makeApiCall('/auth/2fa/verify-setup/', {
        method: 'POST',
        body: JSON.stringify({ code: verificationCode })
      });
      if (data.success) {
        if (data.backup_codes && data.backup_codes.length > 0) {
          setSetupData(prev => prev ? {
            ...prev,
            backup_codes: data.backup_codes
          } : null);
        } else {
          setSetupData(null);
        }
        setVerificationCode("");
        await loadTwoFAStatus();
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been successfully enabled for your account.",
        });
      }
    } catch (error: any) {
      console.error('Error verifying 2FA setup:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFA = async () => {
    if (!disablePassword) {
      toast({
        title: "Password Required",
        description: "Please enter your password to disable 2FA.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const data = await makeApiCall('/auth/2fa/disable/', {
        method: 'POST',
        body: JSON.stringify({ password: disablePassword })
      });
      if (data.success) {
        setDisablePassword("");
        setShowDisableDialog(false);
        await loadTwoFAStatus();
        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been disabled for your account.",
        });
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Disable Failed",
        description: error.message || "Failed to disable 2FA. Please check your password and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    try {
      setLoading(true);
      const data = await makeApiCall('/auth/2fa/regenerate-backup-codes/', {
        method: 'POST'
      });
      if (data.success) {
        setSetupData({ ...setupData!, backup_codes: data.backup_codes });
        toast({
          title: "Backup Codes Regenerated",
          description: "New backup codes have been generated. Please save them securely.",
        });
      }
    } catch (error: any) {
      console.error('Error regenerating backup codes:', error);
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate backup codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    if (setupData?.backup_codes) {
      const codesText = setupData.backup_codes.join('\n');
      try {
        await navigator.clipboard.writeText(codesText);
        setCopiedCodes(true);
        toast({
          title: "Backup Codes Copied",
          description: "Backup codes have been copied to your clipboard.",
        });
        setTimeout(() => setCopiedCodes(false), 2000);
      } catch (error) {
        console.error('Failed to copy backup codes:', error);
      }
    }
  };

  const downloadBackupCodes = () => {
    if (setupData?.backup_codes) {
      const codesText = setupData.backup_codes.join('\n');
      const blob = new Blob([codesText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'henotace-2fa-backup-codes.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading && !twofaStatus) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 2FA Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Two-Factor Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {twofaStatus?.is_enabled ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">2FA is enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Your account is protected with two-factor authentication
                    </p>
                    {twofaStatus.created_at && (
                      <p className="text-xs text-muted-foreground">
                        Enabled on {new Date(twofaStatus.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">2FA is disabled</p>
                    <p className="text-sm text-muted-foreground">
                      Your account is not protected with two-factor authentication
                    </p>
                  </div>
                </>
              )}
            </div>
            <Badge variant={twofaStatus?.is_enabled ? "default" : "secondary"}>
              {twofaStatus?.is_enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Setup or Management */}
      {!twofaStatus?.is_enabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Enable Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Two-factor authentication adds an extra layer of security to your account. 
                You'll need an authenticator app like Google Authenticator or Authy.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Download an authenticator app on your phone</li>
                  <li>• Scan the QR code to add your account</li>
                  <li>• Enter the 6-digit code to verify setup</li>
                  <li>• Save your backup codes in a secure location</li>
                </ul>
              </div>

              <Button onClick={setupTwoFA} disabled={loading}>
                {loading ? "Setting up..." : "Enable 2FA"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Manage Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Your account is protected with two-factor authentication. 
                You can regenerate backup codes or disable 2FA if needed.
              </p>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={regenerateBackupCodes}
                  disabled={loading}
                >
                  {loading ? "Regenerating..." : "Regenerate Backup Codes"}
                </Button>
                
                <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={loading}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Disable 2FA
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
                      <AlertDialogDescription>
                        To disable two-factor authentication, please enter your password to confirm this action. 
                        This will make your account less secure.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <Label htmlFor="disable-password">Password</Label>
                      <Input
                        id="disable-password"
                        type="password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        placeholder="Enter your password"
                        className="mt-2"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => {
                        setDisablePassword("");
                        setShowDisableDialog(false);
                      }}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={disableTwoFA}
                        disabled={loading || !disablePassword}
                      >
                        {loading ? "Disabling..." : "Disable 2FA"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Flow */}
      {setupData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Complete 2FA Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* QR Code */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app:
                </p>
                <div className="inline-block p-4 bg-white rounded-lg border">
                  <img 
                    src={`data:image/png;base64,${setupData.qr_code}`} 
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label htmlFor="secret-key">Manual Entry Key:</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="secret-key"
                    value={setupData.secret_key}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.secret_key);
                      toast({
                        title: "Secret Key Copied",
                        description: "The secret key has been copied to your clipboard.",
                      });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-2">
                <Label htmlFor="verification-code">Enter Verification Code:</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code from your app"
                  maxLength={6}
                />
              </div>

              <Button 
                onClick={verifyTwoFASetup} 
                disabled={loading || verificationCode.length !== 6}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify and Enable 2FA"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes */}
      {setupData?.backup_codes && setupData.backup_codes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Backup Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Save these backup codes
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      These codes can be used to access your account if you lose your authenticator device. 
                      Each code can only be used once.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Backup Codes:</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                    >
                      {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyBackupCodes}
                    >
                      {copiedCodes ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadBackupCodes}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {setupData.backup_codes.map((code, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-center">
                      {showBackupCodes ? code : "••••••••"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

