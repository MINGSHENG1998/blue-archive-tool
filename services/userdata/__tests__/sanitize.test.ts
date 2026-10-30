import {
  asFlag,
  asHttpUrl,
  asRecord,
  asStudentId,
  asText,
  clampInt,
  intInRange,
  toInt,
} from "../sanitize";

describe("sanitize", () => {
  it("asRecord accepts plain objects only", () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(asRecord([])).toBeNull();
    expect(asRecord(null)).toBeNull();
    expect(asRecord("x")).toBeNull();
  });

  it("asText trims, rejects empties and non-strings, and caps length", () => {
    expect(asText("  Hina ")).toBe("Hina");
    expect(asText("   ")).toBeUndefined();
    expect(asText(5)).toBeUndefined();
    expect(asText("abcdef", 3)).toBe("abc");
  });

  it("toInt takes integers and integer strings, never fractions", () => {
    expect(toInt(5)).toBe(5);
    expect(toInt("5")).toBe(5);
    expect(toInt(" -3 ")).toBe(-3);
    expect(toInt(4.5)).toBeUndefined();
    expect(toInt("4.5")).toBeUndefined();
    expect(toInt("5e2")).toBeUndefined();
    expect(toInt(NaN)).toBeUndefined();
    expect(toInt(Infinity)).toBeUndefined();
    expect(toInt(null)).toBeUndefined();
    expect(toInt("")).toBeUndefined();
  });

  it("intInRange bounds inclusively", () => {
    expect(intInRange(1, 1, 5)).toBe(1);
    expect(intInRange(5, 1, 5)).toBe(5);
    expect(intInRange(6, 1, 5)).toBeUndefined();
    expect(intInRange(0, 1, 5)).toBeUndefined();
  });

  it("clampInt rounds and clamps typed input, with a fallback for junk", () => {
    expect(clampInt(7, 1, 5, 1)).toBe(5);
    expect(clampInt(-2, 0, 5, 1)).toBe(0);
    expect(clampInt(2.6, 0, 5, 1)).toBe(3);
    expect(clampInt("4", 0, 5, 1)).toBe(4);
    expect(clampInt("x", 0, 5, 1)).toBe(1);
    expect(clampInt(undefined, 0, 5, 2)).toBe(2);
  });

  it("asStudentId wants a positive integer", () => {
    expect(asStudentId(10000)).toBe(10000);
    expect(asStudentId("10000")).toBe(10000);
    expect(asStudentId(0)).toBeUndefined();
    expect(asStudentId(-5)).toBeUndefined();
    expect(asStudentId(1e12)).toBeUndefined();
  });

  it("asFlag is strict about what counts as true", () => {
    expect([true, 1, "true", " TRUE "].map(asFlag)).toEqual([true, true, true, true]);
    expect([false, 0, "false", "yes", null, {}].map(asFlag)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("asHttpUrl allows http(s) only", () => {
    expect(asHttpUrl("https://schaledb.com/a.webp")).toBe("https://schaledb.com/a.webp");
    expect(asHttpUrl("http://example.com")).toBe("http://example.com");
    expect(asHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(asHttpUrl("ftp://x")).toBeUndefined();
    expect(asHttpUrl("https://")).toBeUndefined();
    expect(asHttpUrl("https://a b")).toBeUndefined();
    expect(asHttpUrl(`https://x.com/${"a".repeat(3000)}`)).toBeUndefined();
  });
});
