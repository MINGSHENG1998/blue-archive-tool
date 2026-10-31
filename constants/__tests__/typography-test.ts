import type { Locale } from "../i18n";
import {
  DISPLAY_FAMILY,
  FONT_FAMILY,
  allowsTracking,
  displayFor,
  displayTitle,
  displayTitleFor,
  font,
  fontFor,
  fontForText,
  needsSystemFace,
  systemFace,
  trackingFor,
  typeRamp,
  usesSystemFace,
  type TypeRamp,
} from "../typography";

const ALL: Locale[] = ["en", "zh", "ko", "ja", "vi", "th"];
const TEXT_STYLES: (keyof TypeRamp)[] = [
  "hero",
  "title",
  "section",
  "kicker",
  "labelCaps",
  "body",
  "bodyStrong",
  "caption",
];
const NUMERAL_STYLES: (keyof TypeRamp)[] = ["numXL", "num", "ghost"];
const OUTFIT = new Set<string>(Object.values(FONT_FAMILY));

describe("locale classes", () => {
  it("puts exactly vi and th on the system face", () => {
    expect(ALL.filter(usesSystemFace)).toEqual(["vi", "th"]);
  });

  it("tracks Latin and Vietnamese, never CJK or Thai", () => {
    expect(ALL.filter(allowsTracking)).toEqual(["en", "vi"]);
    expect(trackingFor("th", 1.2)).toBe(0);
    expect(trackingFor("en", 1.2)).toBe(1.2);
  });
});

describe("fontFor", () => {
  it.each(["en", "zh", "ko", "ja"] as const)("is Outfit for %s, same as font()", (locale) => {
    expect(fontFor(locale, "bold")).toEqual(font("bold"));
    expect(fontFor(locale, "600")).toEqual({ fontFamily: FONT_FAMILY.semibold });
  });

  it.each(["vi", "th"] as const)("is the system face at the real weight for %s", (locale) => {
    const style = fontFor(locale, "bold");
    expect("fontFamily" in style).toBe(true);
    expect(style.fontFamily).toBeUndefined();
    expect(style.fontWeight).toBe("700");
    expect(fontFor(locale, "800").fontWeight).toBe("800");
    expect(fontFor(locale).fontWeight).toBe("400");
  });

  it("clears a family named earlier in a spread", () => {
    expect({ ...font("bold"), ...systemFace("bold") }.fontFamily).toBeUndefined();
  });
});

describe("needsSystemFace", () => {
  it.each([
    "Tiếng Việt",
    "Đồ bơi",
    "Học sinh",
    "ư",
    "Sinh nhật hôm nay",
    "ไทย",
    "เซนเซ",
    // Decomposed: a + combining dot below.
    "a\u0323",
  ])("is true for %s", (text) => {
    expect(needsSystemFace(text)).toBe(true);
  });

  it.each(["English", "Café", "Blue Archive", "Ăn", "Đ", "日本語", "한국어", "3★ 1:23.456", ""])(
    "is false for %s, which Outfit draws (or the platform draws whole)",
    (text) => {
      expect(needsSystemFace(text)).toBe(false);
    },
  );

  it("picks the face per string, whatever the UI language", () => {
    expect(fontForText("Tiếng Việt", "en", "semibold").fontFamily).toBeUndefined();
    expect(fontForText("English", "en", "semibold")).toEqual(font("semibold"));
    expect(fontForText("English", "th", "semibold").fontFamily).toBeUndefined();
  });
});

describe("typeRamp", () => {
  it("leaves English exactly as tuned", () => {
    const ramp = typeRamp("en");
    expect(ramp.hero).toMatchObject({
      fontFamily: FONT_FAMILY.extrabold,
      fontSize: 30,
      lineHeight: 36,
      letterSpacing: -0.7,
    });
    expect(ramp.body).toEqual({ fontFamily: FONT_FAMILY.regular, fontSize: 15, lineHeight: 21 });
  });

  it("keeps CJK on Outfit with its taller heading leading", () => {
    const ramp = typeRamp("ja");
    expect(ramp.title).toMatchObject({ fontFamily: FONT_FAMILY.extrabold, lineHeight: 30, letterSpacing: 0 });
    expect(ramp.body.lineHeight).toBe(21);
  });

  it.each(["vi", "th"] as const)("never puts %s text in Outfit", (locale) => {
    const ramp = typeRamp(locale);
    for (const key of TEXT_STYLES) {
      expect(OUTFIT.has(String(ramp[key].fontFamily))).toBe(false);
      expect(ramp[key].fontFamily).toBeUndefined();
      expect(ramp[key].fontWeight).toBeDefined();
    }
  });

  it.each(ALL)("keeps numerals in Saira for %s", (locale) => {
    const ramp = typeRamp(locale);
    for (const key of NUMERAL_STYLES) {
      expect(Object.values(DISPLAY_FAMILY)).toContain(ramp[key].fontFamily);
    }
  });

  it("never letter-spaces Thai and gives its marks room", () => {
    const ramp = typeRamp("th");
    for (const key of TEXT_STYLES) {
      const style = ramp[key];
      expect(style.letterSpacing ?? 0).toBe(0);
      expect(style.lineHeight).toBeGreaterThanOrEqual(Math.round(Number(style.fontSize) * 1.5));
    }
  });

  it("gives stacked Vietnamese diacritics headroom on headings", () => {
    const ramp = typeRamp("vi");
    expect(ramp.hero.lineHeight).toBe(39);
    expect(ramp.hero.letterSpacing).toBeCloseTo(-0.35);
    expect(ramp.body.lineHeight).toBe(21);
  });

  it("keeps the weights per role", () => {
    const ramp = typeRamp("th");
    expect(ramp.hero.fontWeight).toBe("800");
    expect(ramp.section.fontWeight).toBe("700");
    expect(ramp.labelCaps.fontWeight).toBe("600");
    expect(ramp.bodyStrong.fontWeight).toBe("600");
    expect(ramp.caption.fontWeight).toBe("500");
    expect(ramp.body.fontWeight).toBe("400");
  });
});

describe("display helpers", () => {
  it("keeps Saira for Vietnamese display text, which it covers", () => {
    expect(displayFor("vi", "bold", true)).toEqual({ fontFamily: DISPLAY_FAMILY.boldItalic });
  });

  it("sets Thai display text upright in the system face", () => {
    expect(displayFor("th", "extrabold", true)).toEqual({ fontFamily: undefined, fontWeight: "800" });
  });

  it("drops Outfit from the page title for vi and th", () => {
    expect(displayTitleFor("en")).toBe(displayTitle);
    expect(displayTitleFor("ko").letterSpacing).toBe(0);
    expect(displayTitleFor("th")).toMatchObject({ fontFamily: undefined, fontWeight: "800", letterSpacing: 0 });
    expect(displayTitleFor("vi")).toMatchObject({ fontFamily: undefined, letterSpacing: -0.3 });
  });
});
