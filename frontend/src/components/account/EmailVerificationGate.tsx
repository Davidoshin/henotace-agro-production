import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { apiGet } from "@/lib/api";

export const EMAIL_VERIFICATION_ROUTE = "/business/notifications?tab=verification";

type EmailVerificationGateProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
};

export async function checkEmailVerification(): Promise<boolean> {
  if (typeof window === "undefined") return true;

  const cachedUserData = localStorage.getItem("userData");
  if (cachedUserData) {
    try {
      const parsed = JSON.parse(cachedUserData);
      if (parsed?.email_verified === true) {
        return true;
      }
    } catch {
      // ignore cache errors
    }
  }

  try {
    const profile = await apiGet("profile/");
    if (profile) {
      localStorage.setItem("userData", JSON.stringify(profile));
    }
    return !!profile?.email_verified;
  } catch {
    return false;
  }
}

export function EmailVerificationGate({ open, onOpenChange, reason }: EmailVerificationGateProps) {
  const navigate = useNavigate();
  const description = useMemo(() => {
    if (reason) return reason;
    return "Please verify your email to continue.";
  }, [reason]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      navigate(EMAIL_VERIFICATION_ROUTE);
      onOpenChange(false);
    }, 30000);
    return () => clearTimeout(timeout);
  }, [open, navigate, onOpenChange]);

  const handleVerify = () => {
    onOpenChange(false);
    navigate(EMAIL_VERIFICATION_ROUTE);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Email verification required
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleVerify}>Go to verification</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
