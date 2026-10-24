import { characterImageUris, hostedIconUrl, studentIconUris } from "../images";
import { studentIconUrl } from "../schaledb";

describe("student icon fallbacks", () => {
  it("tries our mirror before SchaleDB", () => {
    expect(studentIconUris(10110)).toEqual([
      "https://blue-archive-tool.web.app/icons/10110.webp",
      "https://schaledb.com/images/student/icon/10110.webp",
    ]);
  });

  it("puts a character's stored image first, then derived icons", () => {
    expect(
      characterImageUris({ image: "https://old.example/a.png", studentId: 7 }),
    ).toEqual(["https://old.example/a.png", hostedIconUrl(7), studentIconUrl(7)]);
  });

  it("does not repeat the stored image when it already is the mirror", () => {
    expect(characterImageUris({ image: hostedIconUrl(7), studentId: 7 })).toEqual([
      hostedIconUrl(7),
      studentIconUrl(7),
    ]);
  });

  it("falls back to just the stored image without a studentId", () => {
    expect(characterImageUris({ image: "https://old.example/a.png" })).toEqual([
      "https://old.example/a.png",
    ]);
    expect(characterImageUris({ image: "" })).toEqual([]);
  });
});
