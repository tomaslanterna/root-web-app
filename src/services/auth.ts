import { api } from "@/lib/api";
import type { AuthResponse, AuthUser, LoginCredentials, RegisterInput, ResetPasswordInput, AuthMessage } from "@/types/auth";

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<AuthResponse>("/v1/auth/login", credentials, { skipAuthRedirect: true });
    return data;
  },
  
  googleLogin: async (idToken: string) => {
    const { data } = await api.post<AuthResponse>("/v1/auth/google", { idToken }, { skipAuthRedirect: true });
    return data;
  },

  register: async (registerData: RegisterInput) => {
    const { data } = await api.post<AuthUser>("/v1/auth/register", registerData);
    return data;
  },
  requestPasswordReset: async (email: string) => {
    const { data } = await api.post<AuthMessage>("/v1/auth/forgot-password", { email }, { skipAuthRedirect: true });
    return data;
  },
  resetPassword: async (input: ResetPasswordInput) => {
    const { data } = await api.post<AuthMessage>("/v1/auth/reset-password", input, { skipAuthRedirect: true });
    return data;
  },
};
