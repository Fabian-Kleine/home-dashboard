import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type FullscreenContextValue = {
  isFullscreen: boolean;
  isSupported: boolean;
  toggleFullscreen: () => Promise<void>;
};

const FullscreenContext = createContext<FullscreenContextValue | null>(null);

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const syncFullscreenState = () => {
      const container = containerRef.current;

      setIsSupported(Boolean(document.fullscreenEnabled && container?.requestFullscreen));
      setIsFullscreen(document.fullscreenElement === container);
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;

    if (!container || !document.fullscreenEnabled) {
      return;
    }

    if (document.fullscreenElement === container) {
      await document.exitFullscreen();
      return;
    }

    await container.requestFullscreen();
  }, []);

  const value = useMemo(
    () => ({
      isFullscreen,
      isSupported,
      toggleFullscreen,
    }),
    [isFullscreen, isSupported, toggleFullscreen],
  );

  return (
    <FullscreenContext.Provider value={value}>
      <main ref={containerRef} className="flex min-h-screen overflow-x-clip bg-black">
        {children}
      </main>
    </FullscreenContext.Provider>
  );
}

export function useFullscreen() {
  const context = useContext(FullscreenContext);

  if (!context) {
    throw new Error("useFullscreen must be used within a FullscreenProvider.");
  }

  return context;
}