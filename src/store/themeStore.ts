import { create } from "zustand";

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: localStorage.getItem("crm-theme") === "dark" ? "dark" : "light",

  toggleTheme: () =>
    set((state) => {
      const newMode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("crm-theme", newMode);
      return { mode: newMode };
    }),
}));
