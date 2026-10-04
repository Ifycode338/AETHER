import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { setLogRocketUser, clearLogRocketUser } from '@/lib/logrocket';

const AuthContext = createContext();

const SESSION_TYPE_KEY = 'bennycare_session_type';
const SESSION_TIMEOUT_KEY = 'bennycare_session_timeout';
const SESSION_WARNING_KEY = 'bennycare_session_warning_shown';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_WARNING_MS = 5 * 60 * 1000; // 5 minutes before timeout

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  const [sessionType, setSessionType] = useState(null); // 'user' or 'admin'
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const authInitialized = useRef(false);

  useEffect(() => {
    if (!authInitialized.current) {
      checkAppState();
      setupSessionTimeout();
      authInitialized.current = true;
    }
  }, []);

  const setupSessionTimeout = () => {
    // Check session timeout on mount
    checkSessionTimeout();
    
    // Set up interval to check session timeout
    const interval = setInterval(() => {
      checkSessionTimeout();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  };

  const checkSessionTimeout = () => {
    const sessionTimeout = localStorage.getItem(SESSION_TIMEOUT_KEY);
    const warningShown = localStorage.getItem(SESSION_WARNING_KEY);

    if (!sessionTimeout) {
      // Set initial timeout if authenticated
      if (isAuthenticated) {
        const timeout = Date.now() + SESSION_TIMEOUT_MS;
        localStorage.setItem(SESSION_TIMEOUT_KEY, timeout.toString());
      }
      return;
    }

    const timeRemaining = parseInt(sessionTimeout) - Date.now();
    setSessionTimeRemaining(timeRemaining);

    // Show warning 5 minutes before timeout
    if (timeRemaining < SESSION_WARNING_MS && timeRemaining > 0 && !warningShown) {
      setSessionWarning(true);
      localStorage.setItem(SESSION_WARNING_KEY, 'true');
    }

    // Sign out if session expired
    if (timeRemaining <= 0) {
      logout(false);
      localStorage.removeItem(SESSION_TIMEOUT_KEY);
      localStorage.removeItem(SESSION_WARNING_KEY);
    }
  };

  const resetSessionTimeout = () => {
    const timeout = Date.now() + SESSION_TIMEOUT_MS;
    localStorage.setItem(SESSION_TIMEOUT_KEY, timeout.toString());
    localStorage.removeItem(SESSION_WARNING_KEY);
    setSessionWarning(false);
    setSessionTimeRemaining(SESSION_TIMEOUT_MS);
  };

  const dismissSessionWarning = () => {
    localStorage.setItem(SESSION_WARNING_KEY, 'true');
    setSessionWarning(false);
  };

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);
      
      // Check if user is authenticated with Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get current session type from localStorage
      const currentSessionType = localStorage.getItem(SESSION_TYPE_KEY);
      setSessionType(currentSessionType);
      
      if (session) {
        await checkUserAuth(currentSessionType);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        clearLogRocketUser();
        localStorage.removeItem(SESSION_TYPE_KEY);
      }
      
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async (expectedSessionType = null) => {
    try {
      setIsLoadingAuth(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        // Fetch user profile/role from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        // Check if account is deleted
        if (profile?.is_deleted) {
          await supabase.auth.signOut();
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem(SESSION_TYPE_KEY);
          localStorage.removeItem(SESSION_TIMEOUT_KEY);
          localStorage.removeItem(SESSION_WARNING_KEY);
          setSessionType(null);
          setIsLoadingAuth(false);
          setAuthChecked(true);
          clearLogRocketUser();
          setAuthError({
            type: 'account_deleted',
            message: 'This account has been deleted. Please contact support if this is an error.'
          });
          return;
        }
        
        const userRole = profile?.role || 'user';
        
        // Check if the session type matches the user role
        const currentSessionType = localStorage.getItem(SESSION_TYPE_KEY);
        
        // If there's a session type mismatch, sign out the user
        if (expectedSessionType && currentSessionType !== expectedSessionType) {
          await supabase.auth.signOut();
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem(SESSION_TYPE_KEY);
          setSessionType(null);
          setIsLoadingAuth(false);
          setAuthChecked(true);
          return;
        }
        
        // If session type doesn't match user role, update it
        if (currentSessionType !== userRole) {
          localStorage.setItem(SESSION_TYPE_KEY, userRole);
          setSessionType(userRole);
        }
        
        setUser({ 
          ...currentUser, 
          role: userRole,
          full_name: profile?.full_name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User',
          avatar_url: profile?.avatar_url || null
        });
        setIsAuthenticated(true);
        resetSessionTimeout();
        
        // Set LogRocket user context
        setLogRocketUser({
          id: currentUser.id,
          email: currentUser.email,
          full_name: profile?.full_name || currentUser.user_metadata?.full_name,
          role: userRole
        });
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem(SESSION_TYPE_KEY);
        localStorage.removeItem(SESSION_TIMEOUT_KEY);
        localStorage.removeItem(SESSION_WARNING_KEY);
        setSessionType(null);
      }
      
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem(SESSION_TYPE_KEY);
      localStorage.removeItem(SESSION_TIMEOUT_KEY);
      localStorage.removeItem(SESSION_WARNING_KEY);
      setSessionType(null);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = async (shouldRedirect = true) => {
    if (isLoggingOut) return; // Prevent multiple logout calls
    setIsLoggingOut(true);

    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(SESSION_TYPE_KEY);
    localStorage.removeItem(SESSION_TIMEOUT_KEY);
    localStorage.removeItem(SESSION_WARNING_KEY);
    setSessionType(null);
    setSessionWarning(false);
    setSessionTimeRemaining(null);
    
    // Clear LogRocket user context
    clearLogRocketUser();

    if (shouldRedirect) {
      window.location.href = '/login';
    }

    setIsLoggingOut(false);
  };

  const setSessionTypeByRole = (role) => {
    localStorage.setItem(SESSION_TYPE_KEY, role);
    setSessionType(role);
  };

  const navigateToLogin = () => {
    // Only redirect if not already on login page
    if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      sessionType,
      sessionWarning,
      sessionTimeRemaining,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      setSessionTypeByRole,
      resetSessionTimeout,
      dismissSessionWarning
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
