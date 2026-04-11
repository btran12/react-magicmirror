import React from 'react';
import { Amplify } from 'aws-amplify';
import {
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';

const region = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_yz3WT2sdT';
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '67vv566d0rt1g3odmekd48chjg';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: {
        email: true,
      },
    },
  },
});

export const AuthContext = React.createContext(null);

const parseAuthError = (err) => {
  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }

  return 'Authentication failed. Please try again.';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [signInStep, setSignInStep] = React.useState('');
  const [isPremium, setIsPremium] = React.useState(false);

  const refreshSession = React.useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const attributes = await fetchUserAttributes();
      const accessToken = session.tokens?.accessToken?.toString() || '';

      setUser({
        username: currentUser.username,
        userId: currentUser.userId,
        email: attributes.email || currentUser.signInDetails?.loginId || '',
        name: attributes.name || '',
        accessToken,
      });
      setIsAuthenticated(Boolean(accessToken));
      setSignInStep('');
      setError('');

      // Fetch premium status after successful auth
      if (accessToken) {
        try {
          const entitlementEndpoint = import.meta.env.VITE_ENTITLEMENT_ENDPOINT || '/v1/entitlements/me';
          const response = await fetch(entitlementEndpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const payload = await response.json();
            const premiumFlag = payload?.premium;
            if (premiumFlag === true) {
              setIsPremium(true);
            } else {
              const plan = payload?.plan || payload?.subscription?.plan;
              if (typeof plan === 'string' && plan.toLowerCase() === 'premium') {
                setIsPremium(true);
              } else {
                setIsPremium(false);
              }
            }
          } else {
            setIsPremium(false);
          }
        } catch {
          setIsPremium(false);
        }
      }

      return true;
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      setIsPremium(false);
      return false;
    }
  }, []);

  React.useEffect(() => {
    const init = async () => {
      await refreshSession();
      setIsLoading(false);
    };

    init();
  }, [refreshSession]);

  const login = async ({ email, password }) => {
    setError('');
    try {
      const result = await signIn({ username: email, password });

      if (result?.isSignedIn) {
        const refreshed = await refreshSession();
        return { success: refreshed, isAuthenticated: refreshed };
      }

      const nextStep = result?.nextStep?.signInStep || 'UNKNOWN';
      setSignInStep(nextStep);

      return {
        success: false,
        isAuthenticated: false,
        nextStep,
        message: 'Additional sign-in steps are required for this account.',
      };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, isAuthenticated: false, message };
    }
  };

  const completeNewPassword = async ({ newPassword }) => {
    setError('');
    try {
      const result = await confirmSignIn({ challengeResponse: newPassword });

      if (result?.isSignedIn) {
        const refreshed = await refreshSession();
        return { success: refreshed, isAuthenticated: refreshed };
      }

      const nextStep = result?.nextStep?.signInStep || 'UNKNOWN';
      setSignInStep(nextStep);
      return {
        success: false,
        isAuthenticated: false,
        nextStep,
        message: 'More verification is still required.',
      };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, isAuthenticated: false, message };
    }
  };

  const register = async ({ name, email, password }) => {
    setError('');
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
          autoSignIn: true,
        },
      });

      return {
        success: true,
        nextStep: result.nextStep?.signUpStep || 'DONE',
      };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, message };
    }
  };

  const confirmRegistration = async ({ email, code }) => {
    setError('');
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      return { success: true };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    setError('');
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      setSignInStep('');
      setIsPremium(false);
      return { success: true };
    } catch (err) {
      const message = parseAuthError(err);
      setError(message);
      return { success: false, message };
    }
  };

  const fetchPremiumStatus = async () => {
    if (!isAuthenticated || !user?.accessToken) {
      setIsPremium(false);
      return;
    }

    try {
      const entitlementEndpoint = import.meta.env.VITE_ENTITLEMENT_ENDPOINT || '/v1/entitlements/me';
      const response = await fetch(entitlementEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
        },
      });

      if (!response.ok) {
        setIsPremium(false);
        return;
      }

      const payload = await response.json();
      const premiumFlag = payload?.premium;

      if (premiumFlag === true) {
        setIsPremium(true);
        return;
      }

      const plan = payload?.plan || payload?.subscription?.plan;
      if (typeof plan === 'string' && plan.toLowerCase() === 'premium') {
        setIsPremium(true);
        return;
      }

      if (premiumFlag === false) {
        setIsPremium(false);
        return;
      }

      setIsPremium(false);
    } catch {
      setIsPremium(false);
    }
  };

  const value = {
    region,
    isAuthenticated,
    isLoading,
    user,
    error,
    signInStep,
    isPremium,
    login,
    register,
    confirmRegistration,
    completeNewPassword,
    logout,
    refreshSession,
    fetchPremiumStatus,
    clearError: () => setError(''),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};