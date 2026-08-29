import { api } from "@/lib/api";

export interface CreateTransferRequest {
  event_id: string;
  price: number;
}

export const transfersApi = {
  getTransfers: async (status?: string): Promise<any[]> => {
    const url = status ? `/v1/transfers?status=${status}` : "/v1/transfers";
    const { data } = await api.get(url);
    return data || [];
  },

  createTransfer: async (params: CreateTransferRequest): Promise<any> => {
    const { data } = await api.post("/v1/transfers", params);
    return data;
  },

  startDeal: async (id: string): Promise<any> => {
    const { data } = await api.post(`/v1/transfers/${id}/start-deal`);
    return data;
  },

  getTransferById: async (id: string): Promise<any> => {
    const { data } = await api.get(`/v1/transfers/${id}`);
    return data;
  },

  updateTransferStatus: async (id: string, status: string): Promise<any> => {
    const { data } = await api.patch(`/v1/transfers/${id}/status`, { status });
    return data;
  }
};
