import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  isFirstBoot: boolean;
  hasBooted: boolean;
  openApps: string[];
  foregroundApp: string | null;
  setHasBooted: () => void;
  openApp: (appId: string) => void;
  closeApp: (appId: string) => void;
  setForegroundApp: (appId: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isFirstBoot: true,
      hasBooted: false,
      openApps: [],
      foregroundApp: null,
      setHasBooted: () => set({ isFirstBoot: false, hasBooted: true }),
      openApp: (appId) => {
        const { openApps } = get();
        if (!openApps.includes(appId)) {
          set({ openApps: [...openApps, appId], foregroundApp: appId });
        } else {
          set({ foregroundApp: appId });
        }
      },
      closeApp: (appId) => {
        const { openApps, foregroundApp } = get();
        const newApps = openApps.filter((id) => id !== appId);
        set({
          openApps: newApps,
          foregroundApp:
            foregroundApp === appId
              ? newApps[newApps.length - 1] || null
              : foregroundApp,
        });
      },
      setForegroundApp: (appId) => set({ foregroundApp: appId }),
    }),
    { name: "app-storage" }
  )
);
