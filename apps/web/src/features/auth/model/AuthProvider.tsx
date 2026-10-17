import { ROLE_HOME, type AuthUser, type Session } from '@tigu/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setRefreshHandler } from '../../../shared/api/client';
import { tokenStore } from '../../../shared/api/tokenStore';
import { setLocale } from '../../../shared/i18n';
import { authApi } from '../api/authApi';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: AuthUser };

interface AuthContextValue {
  state: AuthState;
  signIn: (session: Session) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  const signIn = useCallback((session: Session) => {
    tokenStore.set(session.accessToken);
    setLocale(session.user.locale);
    setState({ status: 'authenticated', user: session.user });
  }, []);

  const clear = useCallback(() => {
    tokenStore.set(null);
    setState({ status: 'anonymous', user: null });
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    clear();
    queryClient.clear();
  }, [clear, queryClient]);

  useEffect(() => {
    const refresh = async () => {
      try {
        const session = await authApi.refresh();
        tokenStore.set(session.accessToken);
        setState({ status: 'authenticated', user: session.user });
        return true;
      } catch {
        clear();
        return false;
      }
    };
    setRefreshHandler(refresh);
    void refresh();
    return () => setRefreshHandler(null);
  }, [clear]);

  const value = useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Current user; only call below <RequireAuth>. */
export function useCurrentUser(): AuthUser {
  const { state } = useAuth();
  if (state.status !== 'authenticated')
    throw new Error('useCurrentUser requires an authenticated user');
  return state.user;
}

export function homeFor(user: AuthUser): string {
  return ROLE_HOME[user.role];
}
