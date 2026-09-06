const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ROOT = path.resolve(__dirname, "..");
const { listSchoolData } = require("./archive-utils");

const GENERATED_SCHOOL_FILES = listSchoolData().map((record) =>
  path.join(record.basePath.replace(/^\/+/, ""), "index.html")
);
const GENERATED_FILES = [
  "national-archive.html",
  ...GENERATED_SCHOOL_FILES,
  "sitemap.xml",
  "data/site-search-index.js"
];

function run(workspace, script) {
  const result = spawnSync(process.execPath, [script], {
    cwd: workspace, stdio: "inherit", shell: false
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} failed (${result.status})`);
}

function main() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "pta-generated-check-"));
  try {
    fs.cpSync(ROOT, workspace, {
      recursive: true,
      filter: (source) => ![".git", "node_modules"].includes(path.basename(source))
    });
    for (const script of [
      "scripts/generate-school-pages.js",
      "scripts/generate-national-archive.js",
      "scripts/enhance-public-pages.js",
      "scripts/generate-sitemap.js",
      "scripts/generate-search-index.js"
    ]) run(workspace, script);

    const changed = GENERATED_FILES.filter((file) =>
      !fs.readFileSync(path.join(ROOT, file)).equals(fs.readFileSync(path.join(workspace, file)))
    );
    if (changed.length) {
      console.error("Generated files differ from the current generator output. Review the differences before regenerating; working files were not changed.");
      console.error(`Differences: ${changed.join(", ")}`);
      process.exitCode = 1;
    } else {
      console.log("Generated files are up to date. Working files were not changed.");
    }
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

if (require.main === module) {
  main();
}
