import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/lib/services/auth";
import type { LoginPayload, RegisterPayload, RegisterResponse, User } from "@/lib/types";

const TOKEN_KEY = "arirent_token";
const USER_KEY = "arirent_current_user";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [initializing, setInitializing] = useState(true);

  // Validate the stored session on first load by asking the backend for the current user.
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (active) setInitializing(false);
        return;
      }
      try {
        const freshUser = await authService.getCurrentUser();
        if (!active) return;
        setUser(freshUser);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      } catch {
        // Token is invalid or expired — clear the session.
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setInitializing(false);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const register = (payload: RegisterPayload) => authService.register(payload);

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}