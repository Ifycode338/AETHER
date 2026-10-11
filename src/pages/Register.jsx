import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Mail, Lock, Loader2, CheckCircle, Eye, EyeOff, X, User, AlertCircle, RefreshCw } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const validateFullName = (name) => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    return "";
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return "";
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return Math.min(strength, 4);
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 0: return "bg-red-500";
      case 1: return "bg-red-400";
      case 2: return "bg-yellow-500";
      case 3: return "bg-green-400";
      case 4: return "bg-green-500";
      default: return "bg-gray-300";
    }
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0: return "Very weak";
      case 1: return "Weak";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Strong";
      default: return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    
    // Validate all fields
    const nameValidationError = validateFullName(fullName);
    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);
    
    if (nameValidationError) {
      setFullNameError(nameValidationError);
      return;
    }
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    let deletedProfile = null;
    
    try {
      // Try to sign up without email confirmation
      let { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            display_name: fullName
          }
        }
      });
      
      // If email is already registered, check if account is deleted
      if (error && (error.message?.includes('already registered') || error.message?.includes('User already registered'))) {
        // Check if this email belongs to a deleted account
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, is_deleted')
          .eq('email', email);
        
        deletedProfile = profiles?.find(p => p.is_deleted);
        
        if (deletedProfile) {
          // Account was deleted - reactivate it with fresh data
          // Try to sign in with the provided password to verify ownership
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInError) {
            // Password doesn't match - they need to use the old password or a different email
            throw new Error('This email was previously used. Please use a different email or your original password.');
          }
          
          // Password matches - reactivate the account
          await supabase
            .from('profiles')
            .update({
              is_deleted: false,
              deleted_at: null,
              full_name: fullName,
              phone: '',
              address: '',
              avatar_url: null
            })
            .eq('id', deletedProfile.id);
          
          // Clear old data
          await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', deletedProfile.id);
          
          await supabase
            .from('user_2fa')
            .delete()
            .eq('user_id', deletedProfile.id);
          
          // Log them in
          data = signInData;
          error = null;
        } else {
          // Account exists and is not deleted - normal error
          throw error;
        }
      }
      
      if (error) {
        throw error;
      }
      
      setUserEmail(email);
      
      // Create profile entry (only if new registration)
      if (data.user && !deletedProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: 'user'
          });
        if (profileError) {
          // Don't block signup for profile creation errors
          console.warn('Profile creation failed, but signup succeeded. User will need to complete profile later.');
        }
      }
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        toast.success("Registration successful! Please check your email to confirm your account.");
      } else if (data.session) {
        toast.success("Registration successful! You are now logged in.");
        // Redirect to home page after successful signup with session
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        toast.success("Registration successful!");
      }
      
      // Show success message
      setShowSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message?.includes('already registered') || err.message?.includes('duplicate') || err.message?.includes('User already registered')) {
        setError("This email is already registered. Please login or use a different email.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
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
    if (error) console.error('Google login error:', error);
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: window.location.origin + '/login'
        }
      });
      
      if (error) throw error;
      
      toast.success("Verification email resent! Please check your inbox.");
    } catch (err) {
      toast.error("Failed to resend verification email. Please try again.");
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
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

      {showSuccess ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Registration Successful!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Please check your email to confirm your account. You can login after confirmation.
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleResendEmail}
              disabled={resendingEmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50"
            >
              {resendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend verification email
                </>
              )}
            </button>
            <Link to="/login" className="block text-sm text-primary hover:underline">
              Go to login page
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              autoFocus
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setFullNameError("");
              }}
              className={`pl-10 h-12 ${fullNameError ? 'border-destructive' : ''}`}
              required
            />
          </div>
          {fullNameError && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <X className="w-3 h-3" />
              {fullNameError}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              className={`pl-10 h-12 ${emailError ? 'border-destructive' : ''}`}
              required
            />
          </div>
          {emailError && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <X className="w-3 h-3" />
              {emailError}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
                setPasswordStrength(calculatePasswordStrength(e.target.value));
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
          {password && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i < passwordStrength ? getPasswordStrengthColor(passwordStrength) : 'bg-gray-200'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength: <span className={`font-medium ${passwordStrength >= 3 ? 'text-green-600' : passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {getPasswordStrengthText(passwordStrength)}
                </span>
              </p>
            </div>
          )}
          {passwordError && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <X className="w-3 h-3" />
              {passwordError}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordError("");
              }}
              className={`pl-10 pr-10 h-12 ${confirmPasswordError ? 'border-destructive' : ''}`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPasswordError && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <X className="w-3 h-3" />
              {confirmPasswordError}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
      )}
    </AuthLayout>
  );
}
