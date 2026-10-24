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
import { writeFileSync } from "fs";
import { join } from "path";
import {
  ALL_LOCALES,
  OVERLAY_LOCALES,
  fetchConfig,
  fetchLocalization,
  fetchNameMap,
  fetchStudents,
} from "../services/gamedata/schaledb";

const OUT_DIR = join(__dirname, "..", "assets", "gamedata");

function write(name: string, data: unknown) {
  const path = join(OUT_DIR, name);
  const json = JSON.stringify(data);
  writeFileSync(path, json + "\n", "utf8");
  const kb = (Buffer.byteLength(json, "utf8") / 1024).toFixed(1);
  console.log(`  ${name.padEnd(18)} ${kb.padStart(8)} KB`);
}

async function main() {
  console.log("Fetching SchaleDB…");
  const [config, students] = await Promise.all([
    fetchConfig(60_000),
    fetchStudents("en", 60_000),
  ]);
  console.log(`  build ${config.build}, ${students.length} students\n`);

  write("config.json", config);
  write("students.json", students);
  for (const locale of OVERLAY_LOCALES) {
    write(`names.${locale}.json`, await fetchNameMap(locale, 60_000));
  }
  for (const locale of ALL_LOCALES) {
    write(`labels.${locale}.json`, await fetchLocalization(locale, 60_000));
  }
  console.log("\nDone. Commit assets/gamedata/ so the snapshot ships.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
