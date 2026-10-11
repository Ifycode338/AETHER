import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff, Check, X, Shield, AlertTriangle, Clock } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from "@/lib/AuthContext";
import { TOTP } from 'otpauth';
import { checkRateLimit, recordAttempt, resetRateLimit, getRemainingAttempts } from '@/lib/securityUtils';
import { ErrorHandler, handleSupabaseError } from '@/lib/errorHandler';

export default function Login() {
  const { setSessionTypeByRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(null);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Countdown timer for lockout
  useEffect(() => {
    if (rateLimitError) {
      const interval = setInterval(() => {
        const key = 'bennycare_rate_limit_login';
        const data = JSON.parse(localStorage.getItem(key) || '{"attempts":0,"lockoutUntil":null}');
        
        if (data.lockoutUntil && Date.now() < data.lockoutUntil) {
          const remainingSeconds = Math.ceil((data.lockoutUntil - Date.now()) / 1000);
          setLockoutTimeRemaining(remainingSeconds);
        } else {
          // Lockout period over
          setLockoutTimeRemaining(null);
          setRateLimitError(null);
          setRemainingAttempts(5);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [rateLimitError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");
    setRateLimitError(null);
    
    // Check rate limit
    const rateLimitCheck = checkRateLimit('login');
    if (!rateLimitCheck.allowed) {
      setRateLimitError(rateLimitCheck.error);
      setRemainingAttempts(0);
      return;
    }
    
    setRemainingAttempts(getRemainingAttempts('login'));
    
    // If we're in 2FA verification mode
    if (requires2FA) {
      if (twoFactorCode.length !== 6 || !/^\d+$/.test(twoFactorCode)) {
        setError("Please enter a valid 6-digit code");
        return;
      }
      
      setLoading(true);
      try {
        // Get the user's 2FA secret
        const { data: twoFaData } = await supabase
          .from('user_2fa')
          .select('secret')
          .eq('user_id', authUser.id)
          .eq('enabled', true)
          .single();
        
        if (!twoFaData?.secret) {
          setError("2FA configuration error. Please contact support.");
          setLoading(false);
          return;
        }
        
        // Validate the code using TOTP
        const totp = new TOTP({
          issuer: 'BennyCare',
          label: authUser.email,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: twoFaData.secret
        });
        
        const isValid = totp.validate({ token: twoFactorCode, window: 1 });
        
        if (isValid === null) {
          setError("Invalid or expired code. Please enter a fresh code from your authenticator app.");
          recordAttempt('login');
          setLoading(false);
          return;
        }
        
        // Update last used timestamp
        const { error: updateError } = await supabase
          .from('user_2fa')
          .update({ last_used_at: new Date().toISOString() })
          .eq('user_id', authUser.id);
        
        if (updateError) {
          // Silently fail on 2FA last used update - login still succeeds
        }
        
        // Reset rate limit on successful login
        resetRateLimit('login');
        
        // Force page reload to refresh auth context and profile
        window.location.href = "/";
      } catch (err) {
        setError("Invalid or expired code. Please enter a fresh code from your authenticator app.");
        recordAttempt('login');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Validate inputs
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);
    
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }
    
    setLoading(true);
    try {
      // First, sign out any existing session to prevent cross-session contamination
      await supabase.auth.signOut();
      
      console.log('Attempting login with:', email);
      
      // Then sign in as user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        const appError = handleSupabaseError(error);
        ErrorHandler.handle(appError, 'Login');
        recordAttempt('login');
        setLoading(false);
        setError(appError.message);
        return;
      }
      
      console.log('Login successful:', data);
      
      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      // Set session type based on role
      localStorage.removeItem('bennycare_session_type');
      setSessionTypeByRole(profile?.role === 'admin' ? 'admin' : 'user');
      
      // Check if user has 2FA enabled
      const { data: twoFaData } = await supabase
        .from('user_2fa')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('enabled', true)
        .single();
      
      if (twoFaData) {
        setAuthUser(data.user);
        setRequires2FA(true);
        setLoading(false);
        return;
      }
      
      // Reset rate limit on successful login
      resetRateLimit('login');
      
      // Force page reload to refresh auth context and profile
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
      recordAttempt('login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) toast.error('Google login failed. Please try again.');
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <div className="flex flex-col gap-2">
          <div>
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </div>
        </div>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {rateLimitError && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-medium mb-1">Account temporarily locked</p>
              <p className="text-red-400/70 text-xs">
                Try again in {lockoutTimeRemaining !== null ? formatTime(lockoutTimeRemaining) : '15 minutes'}
              </p>
            </div>
          </div>
        </div>
      )}

      {requires2FA && (
        <div className="mb-4 p-4 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-[#22C55E]" />
            <p className="font-medium text-[#0A3D2E] dark:text-white">Two-Factor Authentication</p>
          </div>
          <p className="text-sm text-[#0A3D2E]/60 dark:text-white/60 mb-3">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!requires2FA && (
          <>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={`pl-10 h-12 ${emailError ? 'border-destructive' : ''}`}
                  required
                />
                {emailError && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {emailError}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className={`pl-10 pr-10 h-12 ${passwordError ? 'border-destructive' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {passwordError}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me
              </Label>
            </div>
          </>
        )}

        {requires2FA && (
          <div className="space-y-2">
            <Label htmlFor="twoFactorCode">Verification Code</Label>
            <Input
              id="twoFactorCode"
              type="text"
              placeholder="Enter 6-digit code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest h-12"
              autoFocus
            />
          </div>
        )}

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {requires2FA ? "Verifying..." : "Logging in..."}
            </>
          ) : (
            requires2FA ? "Verify" : "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
