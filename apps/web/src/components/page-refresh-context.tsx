import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type RefreshHandler = () => void | Promise<void>;

export type PageRefreshConfig = {
  onRefresh: RefreshHandler | null;
  isRefreshing: boolean;
  disabled: boolean;
  label: string;
};

type RegisteredPageRefreshConfig = {
  onRefresh?: RefreshHandler | null;
  isRefreshing?: boolean;
  disabled?: boolean;
  label?: string;
};

type PageRefreshContextValue = {
  refreshConfig: PageRefreshConfig;
  setRefreshConfig: (config: RegisteredPageRefreshConfig | null) => void;
  resetRefreshConfig: () => void;
};

const defaultRefreshConfig: PageRefreshConfig = {
  onRefresh: null,
  isRefreshing: false,
  disabled: true,
  label: "Refresh unavailable",
};

const PageRefreshContext = createContext<PageRefreshContextValue | null>(null);

export function PageRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshConfig, setRefreshConfigState] = useState<PageRefreshConfig>(defaultRefreshConfig);

  const resetRefreshConfig = useCallback(() => {
    setRefreshConfigState(defaultRefreshConfig);
  }, []);

  const setRefreshConfig = useCallback((config: RegisteredPageRefreshConfig | null) => {
    if (!config) {
      setRefreshConfigState(defaultRefreshConfig);
      return;
    }

    setRefreshConfigState({
      ...defaultRefreshConfig,
      ...config,
      onRefresh: config.onRefresh ?? null,
    });
  }, []);

  const value = useMemo(
    () => ({
      refreshConfig,
      setRefreshConfig,
      resetRefreshConfig,
    }),
    [refreshConfig, resetRefreshConfig, setRefreshConfig],
  );

  return <PageRefreshContext.Provider value={value}>{children}</PageRefreshContext.Provider>;
}

export function usePageRefreshControls() {
  const context = useContext(PageRefreshContext);

  if (!context) {
    throw new Error("usePageRefreshControls must be used within a PageRefreshProvider.");
  }

  return context;
}

export function useRegisterPageRefresh(config: RegisteredPageRefreshConfig | null) {
  const { resetRefreshConfig, setRefreshConfig } = usePageRefreshControls();

  useEffect(() => {
    if (!config) {
      resetRefreshConfig();
      return;
    }

    setRefreshConfig(config);

    return () => {
      resetRefreshConfig();
    };
  }, [config?.disabled, config?.isRefreshing, config?.label, config?.onRefresh, resetRefreshConfig, setRefreshConfig]);
}