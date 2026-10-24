/**
 * Mirror every student's SchaleDB icon into hosting/icons/ for Firebase Hosting.
 *
 *   npm run icons:refresh
 *
 * Character docs store a full image URL, and every shipped app version loads it
 * as-is. Pointing those URLs at our own Hosting copy means a third party that
 * starts blocking hotlinks (bluearchive.wiki did, Oct 2026) can no longer blank
 * the app. Only missing icons are downloaded; pass --force to refetch all.
 *
 * hosting/icons.json lists the ids actually on disk. The backoffice sync reads
 * it to decide whether a student's `image` can point here yet or must fall back
 * to SchaleDB until the next refresh.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { fetchStudents, studentIconUrl } from "../services/gamedata/schaledb";

const HOSTING_DIR = join(__dirname, "..", "hosting");
const ICON_DIR = join(HOSTING_DIR, "icons");
const MANIFEST = join(HOSTING_DIR, "icons.json");
const CONCURRENCY = 4;

async function download(id: number): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(studentIconUrl(id), {
        signal: AbortSignal.timeout(30_000),
      });
      const type = res.headers.get("content-type") ?? "";
      // A bot challenge arrives as an HTML page; never save that as an icon.
      if (!res.ok || !type.startsWith("image/")) {
        throw new Error(`HTTP ${res.status} ${type}`);
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt >= 3) {
        throw new Error(`icon ${id}: ${err instanceof Error ? err.message : err}`);
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function main() {
  const force = process.argv.includes("--force");
  mkdirSync(ICON_DIR, { recursive: true });

  console.log("Fetching SchaleDB roster…");
  const students = await fetchStudents("en", 60_000);
  const todo = students
    .map((s) => s.Id)
    .filter((id) => force || !existsSync(join(ICON_DIR, `${id}.webp`)));
  console.log(`  ${students.length} students, ${todo.length} icon(s) to download`);

  const failed: number[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < todo.length) {
        const id = todo[next++];
        try {
          writeFileSync(join(ICON_DIR, `${id}.webp`), await download(id));
        } catch (err) {
          failed.push(id);
          console.error(`  ${err instanceof Error ? err.message : err}`);
        }
      }
    }),
  );

  // Built from disk, so an icon that failed to download is never advertised.
  const hosted = readdirSync(ICON_DIR)
    .map((name) => /^(\d+)\.webp$/.exec(name)?.[1])
    .filter((id): id is string => id !== undefined)
    .map(Number)
    .sort((a, b) => a - b);
  writeFileSync(MANIFEST, JSON.stringify(hosted) + "\n", "utf8");
  console.log(`  icons.json lists ${hosted.length} icon(s)`);

  // Partial failures still deploy what did download; the next run retries.
  if (failed.length > 0) {
    console.warn(`\nWARN: ${failed.length} icon(s) failed: ${failed.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
