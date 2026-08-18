import { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import { useTheme } from "next-themes";

export type SiteScope = "learn";

const SiteScopeContext = createContext<SiteScope>("learn");

export const SiteScopeProvider = ({ children }: { children: ReactNode }) => {
  const { setTheme } = useTheme();

  // Force light theme for Learn platform
  useEffect(() => {
    if (typeof document === "undefined") return;
    const target = "light";
    const root = document.documentElement;

    const apply = () => {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = target;
    };

    setTheme(target);
    apply();
  }, [setTheme]);

  return <SiteScopeContext.Provider value="learn">{children}</SiteScopeContext.Provider>;
};

export const useSiteScope = (): SiteScope => useContext(SiteScopeContext);
