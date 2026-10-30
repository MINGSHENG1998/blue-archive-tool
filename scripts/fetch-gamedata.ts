/**
 * Regenerate the bundled SchaleDB snapshot in assets/gamedata/.
 *
 *   npm run gamedata:refresh
 *
 * The snapshot is the app's offline floor: it is what users see on a cold
 * first launch, on a plane, and whenever the network refresh fails. Refresh it
 * before cutting a release so a fresh install is not months behind.
 *
 * Uses the same client the app uses, so the bundled shape and the fetched
 * shape cannot drift.
 */
import { readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import {
  ALL_LOCALES,
  OVERLAY_LOCALES,
  fetchConfig,
  fetchLocalization,
  fetchNameMap,
  fetchRaidNames,
  fetchRaids,
  fetchStudents,
} from "../services/gamedata/schaledb";

const OUT_DIR = join(__dirname, "..", "assets", "gamedata");
const TIMEOUT_MS = 60_000;

function write(name: string, data: unknown) {
  const path = join(OUT_DIR, name);
  const json = JSON.stringify(data);
  writeFileSync(path, json + "\n", "utf8");
  const kb = (Buffer.byteLength(json, "utf8") / 1024).toFixed(1);
  console.log(`  ${name.padEnd(18)} ${kb.padStart(8)} KB`);
}

/** The whole folder, since that is what ships inside the app binary. */
function folderKb(): string {
  const bytes = readdirSync(OUT_DIR)
    .filter((name) => name.endsWith(".json"))
    .reduce((sum, name) => sum + statSync(join(OUT_DIR, name)).size, 0);
  return (bytes / 1024).toFixed(1);
}

async function main() {
  console.log("Fetching SchaleDB…");
  const before = folderKb();
  const [config, students, raids] = await Promise.all([
    fetchConfig(TIMEOUT_MS),
    fetchStudents("en", TIMEOUT_MS),
    fetchRaids("en", TIMEOUT_MS),
  ]);
  const raidCount = Object.keys(raids.raid).length + Object.keys(raids.multiFloor).length;
  console.log(
    `  build ${config.build}, ${students.length} students, ${raidCount} raid bosses\n`,
  );

  write("config.json", config);
  write("students.json", students);
  write("raids.json", raids);
  for (const locale of OVERLAY_LOCALES) {
    write(`names.${locale}.json`, await fetchNameMap(locale, TIMEOUT_MS));
    write(`raids.${locale}.json`, await fetchRaidNames(locale, TIMEOUT_MS));
  }
  for (const locale of ALL_LOCALES) {
    write(`labels.${locale}.json`, await fetchLocalization(locale, TIMEOUT_MS));
  }
  console.log(`\n  assets/gamedata ${before} KB -> ${folderKb()} KB`);
  console.log("\nDone. Commit assets/gamedata/ so the snapshot ships.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
