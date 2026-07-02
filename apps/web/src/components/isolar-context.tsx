import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ROUTES, type IsolarSolarData, type IsolarStatusResponse } from "@repo/shared";

import { useTranslation } from "@/lib/use-translation";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";
const ISOLAR_STATUS_QUERY_KEY = ["isolar-status"];
const ISOLAR_SOLAR_DATA_QUERY_KEY = ["isolar-solar-data"];
const SOLAR_DATA_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type IsolarContextValue = {
  isLoggedIn: boolean;
  isLoginDialogOpen: boolean;
  openLoginDialog: () => void;
  closeLoginDialog: () => void;
  login: (email: string, password: string) => Promise<void>;
  isLoggingIn: boolean;
  loginError: string | null;
  clearLoginError: () => void;
  logout: () => void;
  isLoggingOut: boolean;
  solarData: IsolarSolarData | undefined;
  isSolarDataLoading: boolean;
  refetchSolarData: () => Promise<unknown>;
};

const IsolarContext = createContext<IsolarContextValue | null>(null);

async function fetchIsolarStatus(signal?: AbortSignal): Promise<IsolarStatusResponse> {
  const response = await fetch(new URL(API_ROUTES.isolarStatus, BACKEND_URL), {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error("Unable to check the Sungrow connection status.");
  }

  return (await response.json()) as IsolarStatusResponse;
}

async function fetchIsolarSolarData(signal?: AbortSignal): Promise<IsolarSolarData> {
  const response = await fetch(new URL(API_ROUTES.isolarSolarData, BACKEND_URL), {
    credentials: "include",
    signal,
  });

  const payload = (await response.json()) as IsolarSolarData | { error?: string };

  if (!response.ok) {
    throw new Error("error" in payload && payload.error ? payload.error : "Unable to fetch solar data.");
  }

  return payload as IsolarSolarData;
}

export function IsolarProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ISOLAR_STATUS_QUERY_KEY,
    queryFn: ({ signal }) => fetchIsolarStatus(signal),
    staleTime: 60 * 1000,
    retry: false,
  });

  const isLoggedIn = statusQuery.data?.loggedIn ?? false;

  const solarDataQuery = useQuery({
    queryKey: ISOLAR_SOLAR_DATA_QUERY_KEY,
    queryFn: ({ signal }) => fetchIsolarSolarData(signal),
    enabled: isLoggedIn,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: SOLAR_DATA_REFRESH_INTERVAL_MS - 1_000,
  });

  useEffect(() => {
    if (solarDataQuery.isError) {
      void queryClient.invalidateQueries({ queryKey: ISOLAR_STATUS_QUERY_KEY });
    }
  }, [solarDataQuery.isError, queryClient]);

  const openLoginDialog = useCallback(() => {
    setLoginError(null);
    setIsLoginDialogOpen(true);
  }, []);

  const closeLoginDialog = useCallback(() => {
    setIsLoginDialogOpen(false);
  }, []);

  const clearLoginError = useCallback(() => {
    setLoginError(null);
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch(new URL(API_ROUTES.isolarLogin, BACKEND_URL), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? t.isolarLogin.fallbackError);
      }
    },
    onSuccess: () => {
      setLoginError(null);
      setIsLoginDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ISOLAR_STATUS_QUERY_KEY });
    },
    onError: (error: Error) => {
      setLoginError(error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(new URL(API_ROUTES.isolarLogout, BACKEND_URL), {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ISOLAR_STATUS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: ISOLAR_SOLAR_DATA_QUERY_KEY });
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation]
  );

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const value = useMemo<IsolarContextValue>(
    () => ({
      isLoggedIn,
      isLoginDialogOpen,
      openLoginDialog,
      closeLoginDialog,
      login,
      isLoggingIn: loginMutation.isPending,
      loginError,
      clearLoginError,
      logout,
      isLoggingOut: logoutMutation.isPending,
      solarData: solarDataQuery.data,
      isSolarDataLoading: solarDataQuery.isLoading,
      refetchSolarData: solarDataQuery.refetch,
    }),
    [
      isLoggedIn,
      isLoginDialogOpen,
      openLoginDialog,
      closeLoginDialog,
      login,
      loginMutation.isPending,
      loginError,
      clearLoginError,
      logout,
      logoutMutation.isPending,
      solarDataQuery.data,
      solarDataQuery.isLoading,
      solarDataQuery.refetch,
    ]
  );

  return <IsolarContext.Provider value={value}>{children}</IsolarContext.Provider>;
}

export function useIsolar() {
  const context = useContext(IsolarContext);

  if (!context) {
    throw new Error("useIsolar must be used within an IsolarProvider.");
  }

  return context;
}
