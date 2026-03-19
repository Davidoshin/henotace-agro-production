import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Shield, Loader2 } from 'lucide-react';

export default function SessionAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    action?: string;
    device?: { browser?: string; os?: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const action = searchParams.get('action');

    if (!token || !action) {
      setError('Missing required parameters. Please use the link from your email.');
      setLoading(false);
      return;
    }

    if (action !== 'approve' && action !== 'deny') {
      setError('Invalid action. Action must be "approve" or "deny".');
      setLoading(false);
      return;
    }

    // Make the API call to the backend
    const processAction = async () => {
      try {
        const response = await fetch(`/api/auth/session-action/?token=${encodeURIComponent(token)}&action=${encodeURIComponent(action)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to process request');
          setLoading(false);
          return;
        }

        setResult({
          success: true,
          message: data.message,
          action: data.action || action,
          device: data.device,
        });
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'An error occurred while processing your request');
        setLoading(false);
      }
    };

    processAction();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Processing your request...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <XCircle className="w-16 h-16 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/business-login')} variant="outline">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isApproved = result?.action === 'approved' || result?.action === 'approve';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {isApproved ? (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            ) : (
              <Shield className="w-16 h-16 text-orange-500" />
            )}
          </div>
          <CardTitle className="text-xl">
            {isApproved ? 'Device Approved' : 'Device Blocked'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {result?.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result?.device && (
            <div className="bg-muted rounded-lg p-4 text-sm">
              <p><strong>Browser:</strong> {result.device.browser || 'Unknown'}</p>
              <p><strong>OS:</strong> {result.device.os || 'Unknown'}</p>
            </div>
          )}
          <div className="flex justify-center">
            <Button onClick={() => navigate('/business-login')}>
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
