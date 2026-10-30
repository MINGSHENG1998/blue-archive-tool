import {
  THEMES, THEME_ORDER, DEFAULT_THEME_ID, buildTheme, mix, withAlpha, ThemeCore,
} from "../theme";

const CORE_KEYS: (keyof ThemeCore)[] = [
  "isDark", "appBg", "surfaceBg", "elevatedBg", "surfaceBorder",
  "textPrimary", "textSecondary", "textMuted", "primaryColor",
  "primaryText", "hazardColor", "hazardBg", "hazardBorder",
];

const DARK_CORE: ThemeCore = {
  isDark: true, appBg: "#000000", surfaceBg: "#111111", elevatedBg: "#222222",
  surfaceBorder: "#333333", textPrimary: "#ffffff", textSecondary: "#cccccc",
  textMuted: "#999999", primaryColor: "#128AFA", primaryText: "#000000",
  hazardColor: "#DC2626", hazardBg: "#2A1620", hazardBorder: "#DC2626",
};

describe("buildTheme", () => {
  it("derives accentSoft, overlay, shadow from core", () => {
    const t = buildTheme(DARK_CORE);
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

  it("honors the optional signal/halo overrides", () => {
    const t = buildTheme({ ...DARK_CORE, signal: "#FFD000", halo: "#88CCFF" });
    expect(t.signal).toBe("#FFD000");
    expect(t.halo).toBe("#88CCFF");
  });

  it("defaults signal to the in-game yellow with navy ink", () => {
    const t = buildTheme(DARK_CORE);
    expect(t.signal).toBe("#FFE03D");
    expect(t.onSignal).toBe("#16365C");
  });
});

describe("THEMES registry", () => {
  it("default is daylight", () => {
    expect(DEFAULT_THEME_ID).toBe("daylight");
    expect(THEMES.daylight.tokens.isDark).toBe(false);
  });

  it("has all 8 themes, each with a complete token set", () => {
    const ids = [
      "baBlue", "daylight", "paper", "cozy", "calico", "sea", "tropical", "cafe",
    ];
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
      // Dark themes keep a pure-black shadow (it barely shows); light themes use
      // a tinted dark shadow derived from the surface hue. Either way: a hex.
      expect(t.tokens.shadow).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.tokens.shadow).toBe(t.tokens.isDark ? "#000000" : t.tokens.shadow);
    }
  });

  it("THEME_ORDER lists every theme exactly once, default first", () => {
    expect([...THEME_ORDER].sort()).toEqual(Object.keys(THEMES).sort());
    expect(new Set(THEME_ORDER).size).toBe(THEME_ORDER.length);
    expect(THEME_ORDER[0]).toBe(DEFAULT_THEME_ID);
  });

  it("every theme carries the 2.0 derived tokens", () => {
    const derived = [
      "primaryInk", "primaryA08", "primaryA16", "primaryA28", "hairline",
      "halo", "haloSoft", "skyTop", "skyMid", "skyFade", "signal", "onSignal",
      "signalEdge", "signalHi", "scrim", "scrimFade", "sparkFill", "sparkRing",
      "sparkShard", "success", "successBg",
    ] as const;
    for (const id of THEME_ORDER) {
      for (const k of derived) {
        expect(typeof THEMES[id].tokens[k]).toBe("string");
      }
      // Gradient end stops must be appBg at alpha 0, never 'transparent'.
      expect(THEMES[id].tokens.skyFade).toMatch(/^rgba\(.+,0\)$/);
      expect(THEMES[id].tokens.scrimFade).toMatch(/^rgba\(.+,0\)$/);
    }
  });

  it("daylight is the light in-game palette", () => {
    const t = THEMES.daylight.tokens;
    expect(t.isDark).toBe(false);
    expect(t.appBg).toBe("#F3F6FA");
    expect(t.primaryColor).toBe("#128AFA");
    expect(t.textPrimary).toBe("#13233D");
  });

  it("baBlue keeps the app's signature accent", () => {
    expect(THEMES.baBlue.tokens.primaryColor).toBe("#128AFA");
    expect(THEMES.baBlue.tokens.isDark).toBe(true);
  });
});

describe("color helpers", () => {
  it("mix lerps per channel", () => {
    expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#fff", "#000", 0.5)).toBe("#808080");
  });

  it("withAlpha converts hex and passes non-hex through", () => {
    expect(withAlpha("#128AFA", 0.16)).toBe("rgba(18,138,250,0.16)");
    expect(withAlpha("#fff", 0)).toBe("rgba(255,255,255,0)");
    expect(withAlpha("tomato", 0.5)).toBe("tomato");
  });
});
