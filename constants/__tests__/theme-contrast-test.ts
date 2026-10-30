// Keeps every theme honest without per-theme hand-tuning: the derived 2.0 tokens
// must clear their WCAG floors on the surfaces they are drawn on. A new theme
// that fails here needs a different core color, not a special case.
import { THEMES, THEME_ORDER, contrastRatio } from "../theme";

const AA_TEXT = 4.5;
const NON_TEXT = 3;

describe.each(THEME_ORDER)("theme %s contrast", (id) => {
  const t = THEMES[id].tokens;

  it("body ink and primaryInk pass AA on appBg and elevatedBg", () => {
    for (const bg of [t.appBg, t.elevatedBg]) {
      expect(contrastRatio(t.textPrimary, bg)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(t.primaryInk, bg)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it("halo and signalEdge read as non-text UI on appBg", () => {
    expect(contrastRatio(t.halo, t.appBg)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrastRatio(t.signalEdge, t.appBg)).toBeGreaterThanOrEqual(NON_TEXT);
  });

  it("navy on the signal yellow is at least 7:1", () => {
    expect(contrastRatio(t.onSignal, t.signal)).toBeGreaterThanOrEqual(7);
  });

  it("success green reads on appBg", () => {
    expect(contrastRatio(t.success, t.appBg)).toBeGreaterThanOrEqual(NON_TEXT);
  });

  it("ink stays legible on the sky band", () => {
    expect(contrastRatio(t.textPrimary, t.skyTop)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe("contrastRatio", () => {
  it("matches the WCAG reference points", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
  });
});
