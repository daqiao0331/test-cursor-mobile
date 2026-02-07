import { AppManager } from "./apps/base/AppManager";
import { appRegistry } from "./config/appRegistry";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeProvider";
import type { AnyApp } from "./apps/base/types";

const apps: AnyApp[] = Object.values(appRegistry);

export function App() {
  return (
    <ThemeProvider>
      <AppManager apps={apps} />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}
