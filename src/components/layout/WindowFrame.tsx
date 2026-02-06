import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/useThemeStore";

interface WindowFrameProps {
  title: string;
  onClose: () => void;
  isForeground: boolean;
  children: React.ReactNode;
  appId: string;
  skipInitialSound?: boolean;
  instanceId?: string;
  menuBar?: React.ReactNode;
  material?: "default" | "transparent" | "notitlebar";
  windowSize?: { width: number; height: number };
}

export function WindowFrame({
  title,
  onClose,
  isForeground,
  children,
  menuBar,
  material = "default",
  windowSize,
}: WindowFrameProps) {
  const currentTheme = useThemeStore((state) => state.current);
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg overflow-hidden",
        "border shadow-lg",
        material === "transparent" && "bg-white/80 backdrop-blur-lg",
        material === "default" && "bg-white",
        isForeground ? "z-10" : "z-0",
        currentTheme === "system7" &&
          "border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]",
        currentTheme === "macosx" &&
          "border-black/30 rounded-lg shadow-[0_3px_10px_rgba(0,0,0,0.3)]",
        currentTheme === "xp" &&
          "border-[3px] border-[#0054E3] rounded-[0.5rem] shadow-[0_4px_8px_rgba(0,0,0,0.25)]",
        currentTheme === "win98" &&
          "border-2 rounded-none border-t-white border-l-white border-b-[#808080] border-r-[#808080]"
      )}
      style={{ width: windowSize?.width ?? 650, height: windowSize?.height ?? 475 }}
    >
      {/* Title Bar */}
      {material !== "notitlebar" && (
        <div
          className={cn(
            "flex items-center justify-between px-2 py-1 select-none",
            currentTheme === "system7" && "bg-white border-b-2 border-black",
            currentTheme === "macosx" &&
              "bg-gradient-to-b from-[#E8E8E8] to-[#C8C8C8] border-b border-black/20",
            currentTheme === "xp" &&
              (isForeground
                ? "bg-gradient-to-r from-[#0A246A] to-[#0054E3] text-white"
                : "bg-gradient-to-r from-[#7C96C8] to-[#7C96C8] text-white/70"),
            currentTheme === "win98" &&
              (isForeground
                ? "bg-gradient-to-r from-[#000080] to-[#1084D0] text-white"
                : "bg-[#808080] text-white/70")
          )}
        >
          {/* Traffic Lights / Close Button */}
          {currentTheme === "macosx" ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E14640] hover:brightness-90"
                aria-label="Close"
              />
              <button
                className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#DFA123]"
                aria-label="Minimize"
              />
              <button
                className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]"
                aria-label="Maximize"
              />
            </div>
          ) : (
            <span className="text-sm font-bold truncate flex-1">{title}</span>
          )}

          {/* Title Center */}
          {currentTheme === "macosx" && (
            <span className="text-sm font-semibold text-black/80 absolute left-1/2 transform -translate-x-1/2">
              {title}
            </span>
          )}

          {/* Close Button for non-macOS themes */}
          {currentTheme !== "macosx" && (
            <button
              onClick={onClose}
              className={cn(
                "px-2 py-0.5 text-xs font-bold",
                currentTheme === "system7" &&
                  "border border-black bg-white hover:bg-black hover:text-white",
                (currentTheme === "xp" || currentTheme === "win98") &&
                  "bg-[#C0C0C0] border border-white/50 hover:bg-red-500 hover:text-white"
              )}
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Menu Bar in Window (XP/Win98) */}
      {isXpTheme && menuBar && (
        <div className="border-b border-gray-300">{menuBar}</div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
