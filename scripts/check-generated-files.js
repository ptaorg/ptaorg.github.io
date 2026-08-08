const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
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

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status || 1);
}

function main() {
  const before = new Map(GENERATED_FILES.map((file) => [file, fs.readFileSync(file, "utf8")]));
  run("node", ["scripts/generate-school-pages.js"]);
  run("node", ["scripts/generate-national-archive.js"]);
  run("node", ["scripts/enhance-public-pages.js"]);
  run("node", ["scripts/generate-sitemap.js"]);
  run("node", ["scripts/generate-search-index.js"]);

  const changed = GENERATED_FILES.filter((file) => before.get(file) !== fs.readFileSync(file, "utf8"));
  if (changed.length) {
    console.error("Generated files are out of date. Run npm run generate:schools && npm run generate:archive && npm run enhance:pages && npm run generate:sitemap && npm run generate:search, then commit the result.");
    console.error(`Changed during verification: ${changed.join(", ")}`);
    process.exit(1);
  }
  console.log("Generated files are up to date.");
}

if (require.main === module) {
  main();
}
