import api from "@/lib/axios";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  User,
} from "@/lib/types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/login", payload);
    return res.data;
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const res = await api.post<RegisterResponse>("/register", payload);
    return res.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get<{ data: User }>("/me");
    return res.data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/logout");
    } catch {
      // Best-effort: the token is cleared locally regardless of the server response.
    }
  },
};