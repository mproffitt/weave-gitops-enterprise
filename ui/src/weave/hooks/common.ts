import { useContext, useEffect, useState } from "react";
import { AppContext } from "../contexts/AppContext";
import { RequestError } from "../lib/types";

export default function useCommon() {
  const { appState, settings } = useContext(AppContext);

  return { appState, settings };
}

export type RequestState<T> = {
  value: T | null;
  error: RequestError | null;
  loading: boolean;
};

export type ReturnType<T> = [T, boolean, RequestError, (p: Promise<T>) => void];

export function useRequestState<T>(): ReturnType<T> {
  const [state, setState] = useState<RequestState<T>>({
    value: null,
    loading: false,
    error: null,
  });

  async function req(p: Promise<T>) {
    setState({ ...state, loading: true });
    try {
      const res = await p;
      return setState({ value: res, loading: false, error: null });
    } catch (error) {
      return setState({ error: error as RequestError, loading: false, value: null });
    }
  }

  return [state.value as T, state.loading, state.error as RequestError, req];
}

// Copied and TS-ified from https://usehooks.com/useDebounce/
export function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
