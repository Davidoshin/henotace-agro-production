import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { MessageSquare, CheckCircle2, XCircle, RefreshCw, Copy, ExternalLink } from "lucide-react";

export default function TelegramIntegration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [status, setStatus] = useState<{
    is_linked: boolean;
    chat_id?: number;
    username?: string;
    first_name?: string;
    school_name?: string;
  } | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await apiGet("telegram/status/") as any;
      // Map backend response to frontend format
      setStatus({
        is_linked: data.linked || false,
        chat_id: data.telegram_user?.chat_id,
        username: data.telegram_user?.username,
        first_name: data.telegram_user?.first_name,
        school_name: data.school?.name,
      });
    } catch (error: any) {
      console.error("Error loading Telegram status:", error);
      // If 404, user is not linked
      if (error?.status === 404) {
        setStatus({ is_linked: false });
      } else {
        // For other errors, assume not linked
        setStatus({ is_linked: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a verification code",
        variant: "destructive",
      });
      return;
    }

    try {
      setVerifying(true);
      const result = await apiPost("telegram/verify/", {
        code: verificationCode.trim(),
      }) as any;

      if (result.success) {
        toast({
          title: "Success!",
          description: "Your Telegram account has been linked successfully.",
        });
        setVerificationCode("");
        await loadStatus();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to verify code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to verify code. Please check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to unlink your Telegram account?")) {
      return;
    }

    try {
      setVerifying(true);
      const result = await apiPost("telegram/unlink/", {}) as any;

      if (result.success) {
        toast({
          title: "Success",
          description: "Your Telegram account has been unlinked.",
        });
        await loadStatus();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to unlink account",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to unlink account",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Telegram Integration</h1>
        <p className="text-muted-foreground">
          Link your Telegram account to receive school updates and chat with your AI assistant.
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status?.is_linked ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <Badge variant="default" className="bg-green-600">
                  Linked
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                {status.username && (
                  <div>
                    <Label className="text-muted-foreground">Telegram Username:</Label>
                    <p className="font-medium">@{status.username}</p>
                  </div>
                )}
                {status.first_name && (
                  <div>
                    <Label className="text-muted-foreground">Name:</Label>
                    <p className="font-medium">{status.first_name}</p>
                  </div>
                )}
                {status.school_name && (
                  <div>
                    <Label className="text-muted-foreground">School:</Label>
                    <p className="font-medium">{status.school_name}</p>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={handleUnlink}
                  disabled={verifying}
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Unlinking...
                    </>
                  ) : (
                    "Unlink Account"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-muted-foreground" />
                <Badge variant="secondary">Not Linked</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your Telegram account is not linked. Follow the steps below to link it.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linking Instructions */}
      {!status?.is_linked && (
        <Card>
          <CardHeader>
            <CardTitle>How to Link Your Account</CardTitle>
            <CardDescription>
              Connect your Telegram account to receive updates and chat with your AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Open Telegram</p>
                  <p className="text-sm text-muted-foreground">
                    Search for <strong>@henotace_school_bot</strong> on Telegram
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open("https://t.me/henotace_school_bot", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Bot
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Get Verification Code</p>
                  <p className="text-sm text-muted-foreground">
                    Send <code className="bg-muted px-1 rounded">/link</code> to the bot to receive a verification code
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Enter Code Below</p>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code you received from the bot
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div>
                <Label htmlFor="verificationCode">Verification Code</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="font-mono text-lg text-center"
                  />
                  {verificationCode && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(verificationCode)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The code expires in 10 minutes
                </p>
              </div>
              <Button
                onClick={handleVerify}
                disabled={verifying || !verificationCode.trim()}
                className="w-full"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Link Account"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>What You Can Do</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Get real-time school updates and notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Chat with your AI assistant about your school</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Ask questions about students, teachers, and performance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Receive financial summaries and analytics</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

