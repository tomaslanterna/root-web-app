import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

type MutationFunction<TData, TVariables> = (variables: TVariables) => Promise<TData>;

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: AxiosError, variables: TVariables) => void;
}

export function useMutation<TData = any, TVariables = any>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: UseMutationOptions<TData, TVariables>
) {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<AxiosError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await mutationFn(variables);
        setData(result);
        if (options?.onSuccess) {
          options.onSuccess(result, variables);
        }
        return result;
      } catch (err) {
        const axiosError = err as AxiosError;
        setError(axiosError);
        if (options?.onError) {
          options.onError(axiosError, variables);
        }
        throw axiosError;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, options]
  );

  return { mutate, data, error, isLoading };
}
