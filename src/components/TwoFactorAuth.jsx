// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Copy, Check, X, Smartphone, CheckCircle, QrCode } from "lucide-react";
import { toast } from "sonner";
import QRCode from 'qrcode';
import { TOTP } from 'otpauth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TwoFactorAuth({ user, isOpen, onClose }) {
  const [step, setStep] = useState("setup"); // setup, verify, manage
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (user) {
      check2FAStatus();
    }
  }, [user]);

  const check2FAStatus = async () => {
    try {
      const { data } = await supabase
        .from('user_2fa')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data?.enabled) {
        setIsEnabled(true);
        setStep("manage");
      }
    } catch (error) {
      // User doesn't have 2FA set up, which is fine
      setIsEnabled(false);
      setStep("setup");
    }
  };

  const generateSecret = () => {
    // Generate a secure random 32-character Base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const generateQRCode = async (secret) => {
    const issuer = 'BennyCare';
    const account = user.email;
    const otpauth = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;

    try {
      // Generate QR code using the qrcode library
      const qrCodeDataUrl = await QRCode.toDataURL(otpauth, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      // Fallback to API if library fails
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const newSecret = generateSecret();
      setSecret(newSecret);
      const qrCodeUrl = await generateQRCode(newSecret);
      setQrCode(qrCodeUrl);
      
      // Check if user already has a 2FA record
      const { data: existingRecord } = await supabase
        .from('user_2fa')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      let error;
      if (existingRecord) {
        // Update existing record
        const result = await supabase
          .from('user_2fa')
          .update({ 
            secret: newSecret,
            enabled: false,
          })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('user_2fa')
          .insert({
            user_id: user.id,
            secret: newSecret,
            enabled: false,
          });
        error = result.error;
      }
      
      if (error) throw error;
      
      setStep("verify");
    } catch (error) {
      toast.error('Unable to set up 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    
    if (!secret) {
      toast.error('Secret not found. Please try setting up 2FA again.');
      return;
    }
    
    setLoading(true);
    try {
      // Create TOTP instance with the secret
      const totp = new TOTP({
        issuer: 'BennyCare',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
      });
      
      // Validate the token with a reasonable time window
      const isValid = totp.validate({ token: verificationCode, window: 2 });
      
      if (isValid === null) {
        toast.error('❌ Invalid or expired code. Please enter a fresh code from your authenticator app.', {
          duration: 4000,
          position: 'top-center'
        });
        setLoading(false);
        return;
      }
      
      // Enable 2FA
      const { error } = await supabase
        .from('user_2fa')
        .update({ 
          enabled: true,
          last_used_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (error) {
        toast.error('Failed to enable 2FA. Please try again.');
        throw error;
      }
      
      setIsEnabled(true);
      setStep("manage");
      toast.success('🔐 Two-factor authentication is now enabled! Your account is protected.');
    } catch (error) {
      toast.error('Unable to verify code. Please check your authenticator app and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setDisableConfirmOpen(false);
    setDisabling(true);
    try {
      const { error } = await supabase
        .from('user_2fa')
        .update({ enabled: false })
        .eq('user_id', user.id);
      
      if (error) {
        // If the record doesn't exist, that's fine - just update the UI
        if (error.code === 'PGRST116') {
          setIsEnabled(false);
          setStep("setup");
          toast.success('2FA disabled');
          setDisabling(false);
          return;
        }
        throw error;
      }
      
      setIsEnabled(false);
      setStep("setup");
      toast.success('🔓 Two-factor authentication has been disabled.');
    } catch (error) {
      toast.error('Unable to disable 2FA. Please try again.');
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Secret copied to clipboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-[#071f15] border-[#E2F1E7] dark:border-[#22C55E]/10 mx-4 sm:mx-auto max-w-sm">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-[#0A3D2E] dark:text-white text-lg sm:text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#22C55E]" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription className="text-[#0A3D2E]/60 dark:text-white/60 text-sm">
            {step === "setup" && "Add an extra layer of security to your account"}
            {step === "verify" && "Enter the code from your authenticator app"}
            {step === "manage" && "Manage your 2FA settings"}
          </DialogDescription>
        </DialogHeader>

        {step === "setup" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3 p-3 bg-[#F8FAF5] dark:bg-[#051510] rounded-xl">
              <div className="w-10 h-10 bg-[#22C55E]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0A3D2E] dark:text-white">Enhanced Security</p>
                <p className="text-xs text-[#0A3D2E]/60 dark:text-white/60">Protect your account with 2FA codes</p>
              </div>
            </div>
            <Button
              onClick={handleSetup}
              disabled={loading}
              className="w-full bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold rounded-xl h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Set Up 2FA"
              )}
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3 p-3 bg-[#F8FAF5] dark:bg-[#051510] rounded-xl">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                {qrCode ? (
                  <img 
                    src={qrCode} 
                    alt="QR Code for 2FA" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#0A3D2E] dark:text-white mb-1">Scan QR code</p>
                <p className="text-xs text-[#0A3D2E]/60 dark:text-white/60 mb-2">Use your authenticator app</p>
                <div className="flex gap-1">
                  <Input
                    value={secret}
                    readOnly
                    className="font-mono text-xs bg-white dark:bg-[#071f15] h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copySecret}
                    className="h-8 w-8 flex-shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-[#0A3D2E] dark:text-white/70 mb-1.5">
                Verification Code
              </Label>
              <Input
                type="text"
                placeholder="6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-base tracking-widest h-11"
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold rounded-xl h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify and Enable"
              )}
            </Button>
          </div>
        )}

        {step === "manage" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm text-[#0A3D2E] dark:text-white">2FA is enabled</p>
                <p className="text-xs text-[#0A3D2E]/60 dark:text-white/60">Your account is protected</p>
              </div>
            </div>

            <Button
              onClick={() => setDisableConfirmOpen(true)}
              disabled={loading}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl w-full sm:w-auto h-9"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={disableConfirmOpen} onOpenChange={setDisableConfirmOpen}>
        <DialogContent className="bg-white dark:bg-[#071f15] border-[#E2F1E7] dark:border-[#22C55E]/10 mx-4 sm:mx-auto max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#0A3D2E] dark:text-white text-lg sm:text-xl">Disable 2FA?</DialogTitle>
            <DialogDescription className="text-[#0A3D2E]/60 dark:text-white/60 text-sm sm:text-base">
              This will make your account less secure. You'll no longer need to enter a verification code when logging in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setDisableConfirmOpen(false)}
              className="rounded-xl select-none w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisable}
              disabled={disabling}
              className="bg-red-500 text-white hover:bg-red-600 rounded-xl select-none w-full sm:w-auto"
            >
              {disabling ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}