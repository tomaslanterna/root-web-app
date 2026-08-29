import { useState, useEffect, useCallback } from "react";
import { transfersApi } from "@/services/transfers";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useMutation";

export function useTransfers(activeTab: "explorar" | "mis-ofertas") {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransfers = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = activeTab === "explorar" ? "AVAILABLE" : undefined;
      let data = await transfersApi.getTransfers(status);

      // Si es mis-ofertas, filtrar por el usuario
      if (activeTab === "mis-ofertas" && user) {
        data = data.filter(
          (t: any) => t.seller_id === user.id || t.buyer_id === user.id
        );
      }
      setTransfers(data);
    } catch (error) {
      console.error("Error fetching transfers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const { mutate: createTransfer, isLoading: isCreating } = useMutation(
    transfersApi.createTransfer,
    {
      onSuccess: () => {
        fetchTransfers();
      },
    }
  );

  const { mutate: startDeal, isLoading: isStartingDeal } = useMutation(
    transfersApi.startDeal,
    {
      onSuccess: () => {
        fetchTransfers();
      },
    }
  );

  return {
    transfers,
    isLoading,
    fetchTransfers,
    createTransfer,
    isCreating,
    startDeal,
    isStartingDeal,
  };
}
