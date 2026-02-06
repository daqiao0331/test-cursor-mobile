import { Suspense } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useThemeStore } from "@/stores/useThemeStore";
import type { AnyApp } from "./types";
import { cn } from "@/lib/utils";

interface AppManagerProps {
  apps: AnyApp[];
}

const APP_EMOJI: Record<string, string> = {
  finder: "📁",
  textedit: "📝",
  minesweeper: "💣",
  terminal: "💻",
  "control-panels": "⚙️",
  stickies: "📌",
};

export function AppManager({ apps }: AppManagerProps) {
  const { openApps, foregroundApp, openApp, closeApp, setForegroundApp } =
    useAppStore();
  const currentTheme = useThemeStore((state) => state.current);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      {/* Menu Bar (macOS themes) */}
      {(currentTheme === "system7" || currentTheme === "macosx") && (
        <div
          className={cn(
            "h-7 flex items-center px-2 border-b z-50 shrink-0",
            currentTheme === "system7" && "bg-white border-black",
            currentTheme === "macosx" &&
              "bg-gradient-to-b from-[#E8E8E8] to-[#C8C8C8] border-black/20"
          )}
        >
          <span className="text-sm font-bold">🍎</span>
          <span className="text-sm ml-4 font-semibold">
            {foregroundApp
              ? apps.find((a) => a.id === foregroundApp)?.name || "Finder"
              : "Finder"}
          </span>
        </div>
      )}

      {/* Desktop Area */}
      <div
        className={cn(
          "flex-1 relative",
          currentTheme === "system7" && "bg-[#A8A8A8]",
          currentTheme === "macosx" &&
            "bg-gradient-to-b from-[#3B6BC0] to-[#1B3B7B]",
          currentTheme === "xp" && "bg-[#3A6EA5]",
          currentTheme === "win98" && "bg-[#008080]"
        )}
      >
        {/* Desktop Icons */}
        <div className="absolute top-4 right-4 flex flex-col gap-4">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => openApp(app.id)}
              className="flex flex-col items-center gap-1 p-2 rounded hover:bg-white/20 cursor-pointer w-20"
            >
              <span className="text-4xl">
                {APP_EMOJI[app.id] || "📱"}
              </span>
              <span
                className={cn(
                  "text-xs text-center leading-tight",
                  currentTheme === "system7" && "text-black",
                  currentTheme !== "system7" &&
                    "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                )}
              >
                {app.name}
              </span>
            </button>
          ))}
        </div>

        {/* Open Windows */}
        {openApps.map((appId) => {
          const app = apps.find((a) => a.id === appId);
          if (!app) return null;
          const Component = app.component;
          return (
            <div
              key={appId}
              className="absolute inset-0 flex items-center justify-center"
              style={{ zIndex: foregroundApp === appId ? 10 : 1 }}
              onClick={() => setForegroundApp(appId)}
            >
              <Suspense
                fallback={
                  <div className="bg-white p-4 rounded shadow">Loading...</div>
                }
              >
                <Component
                  isWindowOpen={true}
                  onClose={() => closeApp(appId)}
                  isForeground={foregroundApp === appId}
                  instanceId={appId}
                  skipInitialSound={false}
                />
              </Suspense>
            </div>
          );
        })}
      </div>

      {/* Taskbar (Windows themes) */}
      {(currentTheme === "xp" || currentTheme === "win98") && (
        <div
          className={cn(
            "h-8 flex items-center px-1 border-t z-50 shrink-0",
            currentTheme === "xp" &&
              "bg-gradient-to-b from-[#3168D5] to-[#1941A5] border-[#0054E3]",
            currentTheme === "win98" &&
              "bg-[#C0C0C0] border-t-white border-l-white"
          )}
        >
          <button
            className={cn(
              "px-3 py-0.5 text-sm font-bold rounded-sm mr-2",
              currentTheme === "xp" &&
                "bg-gradient-to-b from-[#3B9B43] to-[#237D2B] text-white rounded-[3px]",
              currentTheme === "win98" &&
                "bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-black"
            )}
          >
            {currentTheme === "xp" ? "🪟 Start" : "Start"}
          </button>
          {openApps.map((appId) => {
            const app = apps.find((a) => a.id === appId);
            return (
              <button
                key={appId}
                onClick={() => setForegroundApp(appId)}
                className={cn(
                  "px-3 py-0.5 text-xs truncate max-w-[150px]",
                  currentTheme === "xp" &&
                    (foregroundApp === appId
                      ? "bg-white/30 text-white border border-white/40 rounded-sm"
                      : "text-white/80 hover:bg-white/10 rounded-sm"),
                  currentTheme === "win98" &&
                    (foregroundApp === appId
                      ? "bg-white border border-[#808080] border-t-[#808080] border-l-[#808080] border-b-white border-r-white"
                      : "bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080]")
                )}
              >
                {app?.name || appId}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
