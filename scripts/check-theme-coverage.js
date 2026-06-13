/* Theme coverage guard. Fails (exit 1) if any screen/component file contains a
 * hardcoded color literal outside the allowlist, or reads the OS color scheme. */
const fs = require("fs");
const path = require("path");

const ROOTS = ["app", "components", "contexts", "hooks"];
const ALLOWLIST = new Set([
  path.normalize("constants/theme.ts"),
  path.normalize("constants/Colors.ts"),
  path.normalize("hooks/useColorScheme.ts"),
  path.normalize("hooks/useColorScheme.web.ts"),
  path.normalize("components/ui/customChip.tsx"),
]);

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;
const OS_SCHEME_RE =
  /useColorScheme\s*(as\s+\w+\s*)?\}?\s*from\s*['"]react-native['"]|Appearance\.(getColorScheme|addChangeListener)|from\s*['"]react-native['"][^\n]*\bAppearance\b/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === "__snapshots__") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/-test\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

let violations = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = path.normalize(file);
    if (ALLOWLIST.has(rel)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (COLOR_RE.test(line)) {
        console.error(`COLOR  ${rel}:${i + 1}  ${line.trim()}`);
        violations++;
      }
      if (OS_SCHEME_RE.test(line)) {
        console.error(`OSSCHEME ${rel}:${i + 1}  ${line.trim()}`);
        violations++;
      }
    });
  }
}

if (violations > 0) {
  console.error(`\n${violations} theme-coverage violation(s).`);
  process.exit(1);
}
console.log("theme coverage OK: no stray color literals or OS-scheme reads.");
