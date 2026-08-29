import { api } from "@/lib/api";

export const kycApi = {
  createSession: async (userId: string) => {
    const { data } = await api.post("/v1/kyc/sessions", { userId });
    return data;
  },

  uploadFace: async (sessionId: string, formData: FormData) => {
    const { data } = await api.post(`/v1/kyc/sessions/${sessionId}/face`, formData);
    return data;
  },

  uploadDocument: async (sessionId: string, formData: FormData) => {
    const { data } = await api.post(`/v1/kyc/sessions/${sessionId}/document`, formData);
    return data;
  },

  submitSession: async (sessionId: string) => {
    const { data } = await api.post(`/v1/kyc/sessions/${sessionId}/submit`);
    return data;
  }
};
