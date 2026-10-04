// Rate limiting utilities for authentication attempts
const RATE_LIMIT_KEY = 'bennycare_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const checkRateLimit = (action = 'auth') => {
  const key = `${RATE_LIMIT_KEY}_${action}`;
  const data = JSON.parse(localStorage.getItem(key) || '{"attempts":0,"lockoutUntil":null}');
  
  // Check if currently locked out
  if (data.lockoutUntil && Date.now() < data.lockoutUntil) {
    const remainingTime = Math.ceil((data.lockoutUntil - Date.now()) / 60000);
    return {
      allowed: false,
      error: `Too many attempts. Please try again in ${remainingTime} minutes.`
    };
  }
  
  // Reset if lockout period has passed
  if (data.lockoutUntil && Date.now() >= data.lockoutUntil) {
    data.attempts = 0;
    data.lockoutUntil = null;
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  // Check if max attempts reached
  if (data.attempts >= MAX_ATTEMPTS) {
    data.lockoutUntil = Date.now() + LOCKOUT_DURATION;
    localStorage.setItem(key, JSON.stringify(data));
    return {
      allowed: false,
      error: `Too many attempts. Account locked for ${LOCKOUT_DURATION / 60000} minutes.`
    };
  }
  
  return { allowed: true };
};

export const recordAttempt = (action = 'auth') => {
  const key = `${RATE_LIMIT_KEY}_${action}`;
  const data = JSON.parse(localStorage.getItem(key) || '{"attempts":0,"lockoutUntil":null}');
  
  data.attempts += 1;
  localStorage.setItem(key, JSON.stringify(data));
  
  return data.attempts;
};

export const resetRateLimit = (action = 'auth') => {
  const key = `${RATE_LIMIT_KEY}_${action}`;
  localStorage.removeItem(key);
};

export const getRemainingAttempts = (action = 'auth') => {
  const key = `${RATE_LIMIT_KEY}_${action}`;
  const data = JSON.parse(localStorage.getItem(key) || '{"attempts":0,"lockoutUntil":null}');
  
  // Reset if lockout period has passed
  if (data.lockoutUntil && Date.now() >= data.lockoutUntil) {
    data.attempts = 0;
    data.lockoutUntil = null;
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  if (data.lockoutUntil && Date.now() < data.lockoutUntil) {
    return 0;
  }
  
  const remaining = MAX_ATTEMPTS - data.attempts;
  return Math.max(0, remaining); // Ensure we never return negative
};

// Password strength checker
export const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  let strength = 'weak';
  if (passedChecks >= 4) strength = 'strong';
  else if (passedChecks >= 2) strength = 'medium';
  
  return {
    strength,
    checks,
    passedChecks,
    totalChecks: 5
  };
};

// Security headers helper (for documentation)
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
};
