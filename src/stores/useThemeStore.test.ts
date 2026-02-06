import { describe, it, expect, beforeEach, vi } from "vitest";
import { useThemeStore } from "./useThemeStore";

describe("useThemeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({ current: "system7" });
    vi.spyOn(document.documentElement, "setAttribute").mockImplementation(() => {});
    localStorage.clear();
  });

  describe("initial state", () => {
    it("defaults to system7 theme", () => {
      const state = useThemeStore.getState();
      expect(state.current).toBe("system7");
    });
  });

  describe("setTheme", () => {
    it("updates the current theme", () => {
      useThemeStore.getState().setTheme("macosx");
      expect(useThemeStore.getState().current).toBe("macosx");
    });

    it("sets data-theme attribute on document", () => {
      useThemeStore.getState().setTheme("xp");
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "xp"
      );
    });

    it("supports all theme values", () => {
      const themes = ["system7", "macosx", "xp", "win98"] as const;
      themes.forEach((theme) => {
        useThemeStore.getState().setTheme(theme);
        expect(useThemeStore.getState().current).toBe(theme);
      });
    });
  });

  describe("hydrate", () => {
    it("hydrates from localStorage", () => {
      localStorage.setItem(
        "theme-storage",
        JSON.stringify({ state: { current: "xp" } })
      );
      useThemeStore.getState().hydrate();
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "xp"
      );
    });

    it("falls back to system7 when localStorage is empty", () => {
      useThemeStore.getState().hydrate();
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "system7"
      );
    });

    it("falls back to system7 on invalid JSON", () => {
      localStorage.setItem("theme-storage", "invalid json");
      useThemeStore.getState().hydrate();
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "system7"
      );
    });
  });
});
