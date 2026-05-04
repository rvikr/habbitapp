import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Appearance, useColorScheme as useRNColorScheme } from "react-native";
import { getItem, setItem } from "@/lib/storage";

const STORAGE_KEY = "habbit:theme";

type ColorScheme = "light" | "dark";
type ThemeCtx = { colorScheme: ColorScheme; toggle: () => void };

const ThemeContext = createContext<ThemeCtx>({ colorScheme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useRNColorScheme() ?? "light";
  const [colorScheme, setColorScheme] = useState<ColorScheme>(systemScheme);

  useEffect(() => {
    getItem(STORAGE_KEY).then((saved: string | null) => {
      if (saved === "light" || saved === "dark") {
        setColorScheme(saved);
        Appearance.setColorScheme(saved);
      }
    });
  }, []);

  function toggle() {
    const next: ColorScheme = colorScheme === "light" ? "dark" : "light";
    setColorScheme(next);
    Appearance.setColorScheme(next);
    setItem(STORAGE_KEY, next);
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
