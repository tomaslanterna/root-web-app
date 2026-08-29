import { api } from "@/lib/api";

export const authApi = {
  login: async (credentials: any) => {
    const { data } = await api.post("/v1/auth/login", credentials);
    return data;
  },
  
  googleLogin: async (idToken: string) => {
    const { data } = await api.post("/v1/auth/google", { idToken });
    return data;
  },

  register: async (registerData: any) => {
    const { data } = await api.post("/v1/auth/register", registerData);
    return data;
  }
};
