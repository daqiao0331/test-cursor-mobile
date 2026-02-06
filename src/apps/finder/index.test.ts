import { describe, it, expect } from "vitest";
import { appMetadata, helpItems } from "./index";

describe("Finder app metadata", () => {
  it("has required metadata fields", () => {
    expect(appMetadata.name).toBe("Finder");
    expect(appMetadata.version).toBeTruthy();
    expect(appMetadata.creator.name).toBeTruthy();
    expect(appMetadata.creator.url).toBeTruthy();
    expect(appMetadata.icon).toContain("finder");
  });

  it("has help items", () => {
    expect(helpItems.length).toBeGreaterThan(0);
    helpItems.forEach((item) => {
      expect(item.icon).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
    });
  });
});
