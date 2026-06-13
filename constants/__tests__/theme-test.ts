import { THEMES, DEFAULT_THEME_ID, buildTheme, ThemeCore } from "../theme";

const CORE_KEYS: (keyof ThemeCore)[] = [
  "isDark", "appBg", "surfaceBg", "elevatedBg", "surfaceBorder",
  "textPrimary", "textSecondary", "textMuted", "primaryColor",
  "primaryText", "hazardColor", "hazardBg", "hazardBorder",
];

describe("buildTheme", () => {
  it("derives accentSoft, overlay, shadow from core", () => {
    const t = buildTheme({
      isDark: true, appBg: "#000000", surfaceBg: "#111111", elevatedBg: "#222222",
      surfaceBorder: "#333333", textPrimary: "#ffffff", textSecondary: "#cccccc",
      textMuted: "#999999", primaryColor: "#128AFA", primaryText: "#000000",
      hazardColor: "#DC2626", hazardBg: "#2A1620", hazardBorder: "#DC2626",
    });
    expect(t.accentSoft).toBe("rgba(18,138,250,0.12)");
    expect(t.overlay).toBe("rgba(0,0,0,0.5)");
    expect(t.shadow).toBe("#000000");
  });

  it("uses a lighter overlay for light themes", () => {
    const t = buildTheme({
      isDark: false, appBg: "#fff", surfaceBg: "#eee", elevatedBg: "#fff",
      surfaceBorder: "#ddd", textPrimary: "#000", textSecondary: "#333",
      textMuted: "#777", primaryColor: "#006aff", primaryText: "#fff",
      hazardColor: "#ff5a6e", hazardBg: "#ffe4e8", hazardBorder: "#ff5a6e",
    });
    expect(t.overlay).toBe("rgba(0,0,0,0.35)");
    expect(t.accentSoft).toBe("rgba(0,106,255,0.12)");
  });
});

describe("THEMES registry", () => {
  it("default is baBlue", () => {
    expect(DEFAULT_THEME_ID).toBe("baBlue");
    expect(THEMES.baBlue).toBeDefined();
  });

  it("has all 7 themes, each with a complete token set", () => {
    const ids = ["baBlue", "paper", "cozy", "calico", "sea", "tropical", "cafe"];
    expect(Object.keys(THEMES).sort()).toEqual(ids.sort());
    for (const id of ids) {
      const t = THEMES[id as keyof typeof THEMES];
      expect(t.id).toBe(id);
      expect(typeof t.name).toBe("string");
      for (const k of CORE_KEYS) {
        expect(t.tokens[k] !== undefined).toBe(true);
      }
      expect(typeof t.tokens.accentSoft).toBe("string");
      expect(typeof t.tokens.overlay).toBe("string");
      expect(t.tokens.shadow).toBe("#000000");
    }
  });

  it("baBlue keeps the app's signature accent", () => {
    expect(THEMES.baBlue.tokens.primaryColor).toBe("#128AFA");
    expect(THEMES.baBlue.tokens.isDark).toBe(true);
  });
});
