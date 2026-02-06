import { describe, it, expect } from "vitest";
import { appRegistry } from "./appRegistry";

describe("App Registry", () => {
  const expectedApps = [
    "finder",
    "textedit",
    "minesweeper",
    "terminal",
    "control-panels",
    "stickies",
  ];

  it("has all expected apps registered", () => {
    expectedApps.forEach((appId) => {
      expect(appRegistry[appId]).toBeDefined();
    });
  });

  it("has correct number of registered apps", () => {
    expect(Object.keys(appRegistry)).toHaveLength(expectedApps.length);
  });

  describe.each(expectedApps)("app '%s'", (appId) => {
    it("has an id matching the key", () => {
      expect(appRegistry[appId].id).toBe(appId);
    });

    it("has a non-empty name", () => {
      expect(appRegistry[appId].name).toBeTruthy();
    });

    it("has a valid icon", () => {
      expect(appRegistry[appId].icon.type).toBe("image");
      expect(appRegistry[appId].icon.src).toBeTruthy();
    });

    it("has a description", () => {
      expect(appRegistry[appId].description).toBeTruthy();
    });

    it("has a component", () => {
      expect(appRegistry[appId].component).toBeDefined();
    });

    it("has help items", () => {
      expect(appRegistry[appId].helpItems.length).toBeGreaterThan(0);
    });

    it("has valid metadata", () => {
      const { metadata } = appRegistry[appId];
      expect(metadata.name).toBeTruthy();
      expect(metadata.version).toBeTruthy();
      expect(metadata.creator.name).toBeTruthy();
      expect(metadata.creator.url).toBeTruthy();
      expect(metadata.icon).toBeTruthy();
    });

    it("has valid window config", () => {
      const { windowConfig } = appRegistry[appId];
      expect(windowConfig.defaultSize.width).toBeGreaterThan(0);
      expect(windowConfig.defaultSize.height).toBeGreaterThan(0);
      expect(windowConfig.minSize.width).toBeGreaterThan(0);
      expect(windowConfig.minSize.height).toBeGreaterThan(0);
      expect(windowConfig.minSize.width).toBeLessThanOrEqual(
        windowConfig.defaultSize.width
      );
      expect(windowConfig.minSize.height).toBeLessThanOrEqual(
        windowConfig.defaultSize.height
      );
    });
  });
});
