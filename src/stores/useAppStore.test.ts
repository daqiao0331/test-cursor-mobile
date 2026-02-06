import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./useAppStore";

describe("useAppStore", () => {
  beforeEach(() => {
    // Reset the store before each test
    useAppStore.setState({
      isFirstBoot: true,
      hasBooted: false,
      openApps: [],
      foregroundApp: null,
    });
  });

  describe("initial state", () => {
    it("starts with no open apps", () => {
      const state = useAppStore.getState();
      expect(state.openApps).toEqual([]);
      expect(state.foregroundApp).toBeNull();
    });

    it("starts with first boot flag", () => {
      const state = useAppStore.getState();
      expect(state.isFirstBoot).toBe(true);
      expect(state.hasBooted).toBe(false);
    });
  });

  describe("setHasBooted", () => {
    it("sets boot flags correctly", () => {
      useAppStore.getState().setHasBooted();
      const state = useAppStore.getState();
      expect(state.isFirstBoot).toBe(false);
      expect(state.hasBooted).toBe(true);
    });
  });

  describe("openApp", () => {
    it("adds an app to openApps", () => {
      useAppStore.getState().openApp("finder");
      const state = useAppStore.getState();
      expect(state.openApps).toContain("finder");
      expect(state.foregroundApp).toBe("finder");
    });

    it("sets newly opened app as foreground", () => {
      useAppStore.getState().openApp("finder");
      useAppStore.getState().openApp("textedit");
      const state = useAppStore.getState();
      expect(state.foregroundApp).toBe("textedit");
    });

    it("does not duplicate an already open app", () => {
      useAppStore.getState().openApp("finder");
      useAppStore.getState().openApp("finder");
      const state = useAppStore.getState();
      expect(state.openApps).toEqual(["finder"]);
    });

    it("brings existing app to foreground without duplicating", () => {
      useAppStore.getState().openApp("finder");
      useAppStore.getState().openApp("textedit");
      useAppStore.getState().openApp("finder");
      const state = useAppStore.getState();
      expect(state.openApps).toEqual(["finder", "textedit"]);
      expect(state.foregroundApp).toBe("finder");
    });
  });

  describe("closeApp", () => {
    it("removes an app from openApps", () => {
      useAppStore.getState().openApp("finder");
      useAppStore.getState().closeApp("finder");
      const state = useAppStore.getState();
      expect(state.openApps).not.toContain("finder");
    });

    it("sets foreground to last remaining app when closing foreground app", () => {
      useAppStore.getState().openApp("finder");
      useAppStore.getState().openApp("textedit");
      useAppStore.getState().closeApp("textedit");
      const state = useAppStore.getState();
      expect(state.foregroundApp).toBe("finder");
    });

    it("sets foreground to null when closing the last app", () => {
      useAppStore.getState().openApp("finder");
      useAppStore.getState().closeApp("finder");
      const state = useAppStore.getState();
      expect(state.foregroundApp).toBeNull();
    });

    it("preserves foreground when closing a non-foreground app", () => {
      useAppStore.getState().openApp("finder");
      useAppStore.getState().openApp("textedit");
      useAppStore.getState().closeApp("finder");
      const state = useAppStore.getState();
      expect(state.foregroundApp).toBe("textedit");
    });
  });

  describe("setForegroundApp", () => {
    it("sets the foreground app", () => {
      useAppStore.getState().openApp("finder");
      useAppStore.getState().openApp("textedit");
      useAppStore.getState().setForegroundApp("finder");
      const state = useAppStore.getState();
      expect(state.foregroundApp).toBe("finder");
    });

    it("can set foreground to null", () => {
      useAppStore.getState().openApp("finder");
      useAppStore.getState().setForegroundApp(null);
      const state = useAppStore.getState();
      expect(state.foregroundApp).toBeNull();
    });
  });
});
