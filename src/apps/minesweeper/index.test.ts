import { describe, it, expect } from "vitest";
import { appMetadata, helpItems } from "./index";

describe("Minesweeper app metadata", () => {
  it("has required metadata fields", () => {
    expect(appMetadata.name).toBe("Minesweeper");
    expect(appMetadata.version).toBeTruthy();
    expect(appMetadata.creator.name).toBeTruthy();
    expect(appMetadata.icon).toContain("minesweeper");
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
