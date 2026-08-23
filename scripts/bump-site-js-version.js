const fs = require("fs");
const path = require("path");
const { ROOT, writeFileIfChanged } = require("./archive-utils");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const TARGET_VERSION = args.find((arg) => /^\d+$/.test(arg)) || "93";
const SKIP_DIRS = new Set([".git", ".claude", "assets", "css", "data", "js", "scripts", "tools", "node_modules", "ホーム"]);
const SCRIPT_RE = /(<script\b[^>]*\bsrc=["'])([^"']*js\/site\.js)(?:\?v=\d+)?(["'][^>]*><\/script>)/gi;

function walkHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkHtml(full, files);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

function relativePath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function bumpFile(filePath) {
  const before = fs.readFileSync(filePath, "utf8");
  const after = before.replace(SCRIPT_RE, (_match, prefix, src, suffix) => `${prefix}${src}?v=${TARGET_VERSION}${suffix}`);
  if (after === before) return false;
  if (DRY_RUN) return true;
  return writeFileIfChanged(filePath, after);
}

function main() {
  const matchedFiles = [];
  const changedFiles = [];

  for (const filePath of walkHtml(ROOT)) {
    const before = fs.readFileSync(filePath, "utf8");
    if (!SCRIPT_RE.test(before)) {
      SCRIPT_RE.lastIndex = 0;
      continue;
    }
    SCRIPT_RE.lastIndex = 0;
    matchedFiles.push(filePath);
    if (bumpFile(filePath)) changedFiles.push(filePath);
  }

  const mode = DRY_RUN ? "Would bump" : "Bumped";
  console.log(`${mode} js/site.js cache version to v=${TARGET_VERSION}: ${changedFiles.length}/${matchedFiles.length} files ${DRY_RUN ? "would change" : "changed"}.`);
  for (const filePath of changedFiles) {
    console.log(`- ${relativePath(filePath)}`);
  }
}

if (require.main === module) {
  main();
}
