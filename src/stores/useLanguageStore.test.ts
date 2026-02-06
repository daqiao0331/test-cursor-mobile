import { describe, it, expect, beforeEach } from "vitest";
import { useLanguageStore } from "./useLanguageStore";

describe("useLanguageStore", () => {
  beforeEach(() => {
    useLanguageStore.setState({ current: "en" });
    localStorage.clear();
  });

  describe("initial state", () => {
    it("defaults to English", () => {
      const state = useLanguageStore.getState();
      expect(state.current).toBe("en");
    });
  });

  describe("setLanguage", () => {
    it("updates the current language", () => {
      useLanguageStore.getState().setLanguage("ja");
      expect(useLanguageStore.getState().current).toBe("ja");
    });

    it("updates to any language string", () => {
      useLanguageStore.getState().setLanguage("zh");
      expect(useLanguageStore.getState().current).toBe("zh");
    });
  });

  describe("hydrate", () => {
    it("hydrates from localStorage", () => {
      localStorage.setItem(
        "language-storage",
        JSON.stringify({ state: { current: "ja" } })
      );
      useLanguageStore.getState().hydrate();
      expect(useLanguageStore.getState().current).toBe("ja");
    });

    it("keeps default when localStorage is empty", () => {
      useLanguageStore.getState().hydrate();
      expect(useLanguageStore.getState().current).toBe("en");
    });

    it("keeps default on invalid JSON", () => {
      localStorage.setItem("language-storage", "not json");
      useLanguageStore.getState().hydrate();
      expect(useLanguageStore.getState().current).toBe("en");
    });
  });
});
