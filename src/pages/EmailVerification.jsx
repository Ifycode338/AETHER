import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "sonner";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email_confirmed_at) {
        setVerified(true);
      }
    } catch (error) {
      // User not logged in or session expired
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      setResent(true);
      setCountdown(60);
      toast.success("Confirmation email sent successfully!");
      
      // Countdown timer
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Resend error:', error);
      toast.error("Failed to resend confirmation email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <AuthLayout
        icon={CheckCircle}
        title="Email verified"
        subtitle="Your account has been successfully verified"
        footer={
          <Link to="/login" className="text-primary font-medium hover:underline">
            <ArrowLeft className="w-3 h-3 inline mr-1" />Continue to login
          </Link>
        }
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-sm text-foreground">
            Your email has been verified successfully. You can now log in to your account.
          </p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="w-full"
          >
            Continue to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Mail}
      title="Verify your email"
      subtitle={`We've sent a confirmation link to ${email}`}
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to login
        </Link>
      }
    >
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-blue-500" />
        </div>
        <p className="text-sm text-foreground">
          Please check your email and click the confirmation link to verify your account.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
          <span>The link will expire in 24 hours</span>
        </div>
        <div className="space-y-3">
          <Button
            onClick={checkVerificationStatus}
            variant="outline"
            className="w-full"
          >
            I've verified my email
          </Button>
          <Button
            onClick={handleResend}
            disabled={loading || countdown > 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend email
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Need help? Contact support at <a href="mailto:support@bennycare.com" className="text-primary hover:underline">support@bennycare.com</a>
        </p>
      </div>
    </AuthLayout>
  );
}
