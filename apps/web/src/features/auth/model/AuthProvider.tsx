import { LocaleSchema, ROLE_HOME, type AuthUser, type Session } from '@tigu/shared';
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
import { i18n, setLocale } from '../../../shared/i18n';
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

// Concurrent refreshes (StrictMode double effects, a 401 burst) must share one request:
// sending the same refresh cookie twice looks like token theft to the API.
let refreshInFlight: Promise<Session> | null = null;
function refreshSession(): Promise<Session> {
  refreshInFlight ??= authApi.refresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

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
        const session = await refreshSession();
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

  // The language picked in the UI is saved on the account (spec §12).
  const user = state.user;
  useEffect(() => {
    if (!user) return;
    const onChange = (lng: string) => {
      const parsed = LocaleSchema.safeParse(lng);
      if (!parsed.success || parsed.data === user.locale) return;
      authApi
        .updateMe({ locale: parsed.data })
        .then((updated) => setState({ status: 'authenticated', user: updated }))
        .catch(() => undefined);
    };
    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, [user]);

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
