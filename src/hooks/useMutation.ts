import { useState, useCallback, useEffect, useRef } from 'react';
import { AxiosError } from 'axios';

type MutationFunction<TData, TVariables> = (variables: TVariables) => Promise<TData>;

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: AxiosError, variables: TVariables) => void;
}

export function useMutation<TData = unknown, TVariables = unknown>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: UseMutationOptions<TData, TVariables>
) {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [error, setError] = useState<AxiosError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutationFnRef = useRef(mutationFn);
  const optionsRef = useRef(options);
  useEffect(() => {
    mutationFnRef.current = mutationFn;
    optionsRef.current = options;
  }, [mutationFn, options]);

  const mutate = useCallback(async (variables: TVariables) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await mutationFnRef.current(variables);
        setData(result);
        if (optionsRef.current?.onSuccess) {
          optionsRef.current.onSuccess(result, variables);
        }
        return result;
      } catch (err) {
        const axiosError = err as AxiosError;
        setError(axiosError);
        if (optionsRef.current?.onError) {
          optionsRef.current.onError(axiosError, variables);
        }
        throw axiosError;
      } finally {
        setIsLoading(false);
      }
    }, []);

  return { mutate, data, error, isLoading };
}
