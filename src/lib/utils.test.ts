import { describe, it, expect } from "vitest";
import { cn, assetPath } from "./utils";

describe("cn utility", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isHidden = false;
    const result = cn("base", isHidden && "hidden", "visible");
    expect(result).toBe("base visible");
  });

  it("handles undefined values", () => {
    const result = cn("base", undefined, "end");
    expect(result).toBe("base end");
  });

  it("handles empty string", () => {
    const result = cn("");
    expect(result).toBe("");
  });

  it("merges tailwind conflicting classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("handles arrays", () => {
    const result = cn(["foo", "bar"]);
    expect(result).toBe("foo bar");
  });
});

describe("assetPath utility", () => {
  it("resolves paths with leading slash", () => {
    const result = assetPath("/icons/default/finder.png");
    expect(result).toContain("icons/default/finder.png");
  });

  it("resolves paths without leading slash", () => {
    const result = assetPath("icons/default/finder.png");
    expect(result).toContain("icons/default/finder.png");
  });

  it("does not duplicate slashes", () => {
    const result = assetPath("/icons/test.png");
    expect(result).not.toContain("//icons");
  });
});
