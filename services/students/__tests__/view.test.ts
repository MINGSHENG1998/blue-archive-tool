import { collectionGroups, selectStudentFiles } from "../view";
import type { GameStudent } from "@/services/gamedata/types";
import type { Roster } from "@/services/userdata/roster";

const student = (Id: number, patch: Partial<GameStudent> = {}): GameStudent => ({
  Id, Name: `Student ${Id}`, PathName: `${Id}`, BirthDay: "1/1", StarGrade: 3,
  School: "Gehenna", Club: "", SquadType: "Main", TacticRole: "", Position: "Back",
  WeaponType: "SR", BulletType: "Explosion", ArmorType: "LightArmor", FavorItemTags: [],
  FavorItemUniqueTags: [], SkillMaterial: [], SkillMaterialAmount: [], PotentialMaterial: 0,
  IsReleased: [true, true, true], IsLimited: [0, 0, 0], ...patch,
});
const roster: Roster = { "2": { stars: 5, at: 1 } };
const students = [student(1, { LinkedCharacterId: 2 }), student(2, { LinkedCharacterId: 1 }),
  student(3, { IsLimited: [1, 1, 1] }), student(4, { IsLimited: [2, 2, 2], SquadType: "Support" }),
  student(5, { IsLimited: [3, 3, 3], IsReleased: [true, false, true] })];

it("combines ownership, linked-form watch and squad facets with search", () => {
  expect(selectStudentFiles(students, { owned: "owned", watched: true, squads: ["Main"], query: "Student" }, roster, [2]).map(s => s.Id)).toEqual([1, 2]);
  expect(selectStudentFiles(students, { owned: "missing" }, roster, []).map(s => s.Id)).toEqual([3, 4, 5]);
});

it("missing-limited includes Unique and Fest only, respects server release", () => {
  expect(selectStudentFiles(students, { missingLimited: true, region: "global" }, roster, []).map(s => s.Id)).toEqual([3]);
});

it("counts linked forms once in overall, school and rarity collections", () => {
  const stats = collectionGroups(students, roster, "global");
  expect(stats.overall).toEqual({ owned: 1, total: 3 });
  expect(stats.schools).toEqual([{ key: "Gehenna", owned: 1, total: 3 }]);
  expect(stats.rarities).toEqual([{ key: "3", owned: 1, total: 3 }]);
});
