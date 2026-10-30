import { filterStudents, isLimitedPickup, isReleased, type GameStudent, type RegionKey, type StudentFilters } from "@/services/gamedata";
import { countOwnedUnits, ownsUnit, type Roster, type UnitLike } from "@/services/userdata/roster";

export interface FileFilters extends StudentFilters {
  squads?: string[];
  owned?: "all" | "owned" | "missing";
  watched?: boolean;
  missingLimited?: boolean;
}

export function watchesUnit(ids: readonly number[], student: UnitLike): boolean {
  return ids.includes(student.Id) || (student.LinkedCharacterId !== undefined && ids.includes(student.LinkedCharacterId));
}

export function selectStudentFiles(students: GameStudent[], filters: FileFilters, roster: Roster,
  watchlist: readonly number[], displayName: (student: GameStudent) => string = s => s.Name): GameStudent[] {
  return filterStudents(students, filters, displayName).filter(student => {
    const owned = ownsUnit(roster, student);
    if (filters.owned === "owned" && !owned) return false;
    if (filters.owned === "missing" && owned) return false;
    if (filters.watched && !watchesUnit(watchlist, student)) return false;
    if (filters.missingLimited && (owned || !isLimitedPickup(student, filters.region ?? "global"))) return false;
    return !filters.squads?.length || filters.squads.includes(student.SquadType);
  }).sort((a, b) => b.StarGrade - a.StarGrade || displayName(a).localeCompare(displayName(b)) || a.Id - b.Id);
}

export function collectionGroups(students: GameStudent[], roster: Roster, region?: RegionKey) {
  const pool = region ? students.filter(s => isReleased(s, region)) : students;
  const grouped = (keyOf: (s: GameStudent) => string) => {
    const groups = new Map<string, GameStudent[]>();
    for (const student of pool) {
      const key = keyOf(student);
      groups.set(key, [...(groups.get(key) ?? []), student]);
    }
    return [...groups].map(([key, members]) => ({ key, ...countOwnedUnits(roster, members) }));
  };
  return {
    overall: countOwnedUnits(roster, pool),
    schools: grouped(s => s.School).sort((a, b) => b.total - a.total || a.key.localeCompare(b.key)),
    rarities: grouped(s => String(s.StarGrade)).sort((a, b) => Number(b.key) - Number(a.key)),
  };
}
