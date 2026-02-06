import { describe, it, expect } from "vitest";
import translations from "./locales/en/translation.json";

describe("Translation file", () => {
  it("has common menu translations", () => {
    expect(translations.common.menu.file).toBe("File");
    expect(translations.common.menu.edit).toBe("Edit");
    expect(translations.common.menu.help).toBe("Help");
    expect(translations.common.menu.close).toBe("Close");
    expect(translations.common.menu.save).toBe("Save");
    expect(translations.common.menu.clear).toBe("Clear");
    expect(translations.common.menu.newGame).toBe("New Game");
    expect(translations.common.menu.newNote).toBe("New Note");
  });

  it("has common dialog translations", () => {
    expect(translations.common.dialog.save).toBe("Save");
    expect(translations.common.dialog.cancel).toBe("Cancel");
    expect(translations.common.dialog.ok).toBe("OK");
    expect(translations.common.dialog.close).toBe("Close");
  });

  it("has all app translations", () => {
    const appIds = [
      "finder",
      "textedit",
      "minesweeper",
      "terminal",
      "control-panels",
      "stickies",
    ];
    appIds.forEach((appId) => {
      const app =
        translations.apps[appId as keyof typeof translations.apps];
      expect(app).toBeDefined();
      expect(app.title).toBeTruthy();
      expect(app.name).toBeTruthy();
      expect(app.description).toBeTruthy();
      expect(app.menu.help).toBeTruthy();
      expect(app.menu.about).toBeTruthy();
    });
  });

  it("has help items for each app", () => {
    const apps = translations.apps;
    Object.entries(apps).forEach(([appId, app]) => {
      expect(app.help).toBeDefined();
      const helpEntries = Object.entries(app.help) as [string, { title: string; description: string }][];
      expect(helpEntries.length).toBeGreaterThan(0);
      helpEntries.forEach(([, helpItem]) => {
        expect(helpItem.title).toBeTruthy();
        expect(helpItem.description).toBeTruthy();
      });
      // Ensure no duplicate help entries
      const helpKeys = helpEntries.map(([k]) => k);
      expect(helpKeys.length).toBe(new Set(helpKeys).size);
      // Verify app ID is used in test output for debugging
      expect(appId).toBeTruthy();
    });
  });

  it("has desktop title", () => {
    expect(translations.desktop.title).toBe("ryOS");
  });
});
