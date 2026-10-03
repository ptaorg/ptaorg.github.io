import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildVaultInventory, selectVaultContext } from "./core.mjs";

async function makeVault() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "pta-context-"));
  const dirs = [
    "01_CORE",
    "02_LEGAL",
    "03_CASES/愛媛県",
    "06_AI_SYSTEM",
    "09_ARCHIVE",
    "99_INBOX"
  ];
  for (const dir of dirs) await fs.mkdir(path.join(root, ...dir.split("/")), { recursive: true });

  const routes = {
    version: 1,
    alwaysInclude: ["01_CORE/基本原則.md", "01_CORE/公私分離.md"],
    excludedDirectories: [".obsidian", "09_ARCHIVE", "99_INBOX", "_TEMPLATES"],
    routes: [
      {
        id: "privacy",
        keywords: ["個人情報", "名簿"],
        files: ["02_LEGAL/個人情報保護法.md"]
      },
      {
        id: "fees",
        keywords: ["学校徴収", "会費"],
        files: ["02_LEGAL/PTA会費_学校徴収.md"]
      }
    ]
  };

  await fs.writeFile(path.join(root, "06_AI_SYSTEM", "CONTEXT_ROUTES.json"), JSON.stringify(routes), "utf8");
  await fs.writeFile(path.join(root, "01_CORE", "基本原則.md"), "# 基本原則\ncore", "utf8");
  await fs.writeFile(path.join(root, "01_CORE", "公私分離.md"), "# 公私分離\nseparation", "utf8");
  await fs.writeFile(path.join(root, "02_LEGAL", "個人情報保護法.md"), "# 個人情報保護法\nprivacy", "utf8");
  await fs.writeFile(path.join(root, "02_LEGAL", "PTA会費_学校徴収.md"), "# PTA会費 学校徴収\nfees", "utf8");
  await fs.writeFile(path.join(root, "03_CASES", "愛媛県", "松山市.md"), "# 松山市\ncase", "utf8");
  await fs.writeFile(path.join(root, "09_ARCHIVE", "古い松山市.md"), "# 松山市\nold", "utf8");
  await fs.writeFile(path.join(root, "99_INBOX", "未整理.md"), "# 未整理\nprivate", "utf8");
  return root;
}

test("vault inventory excludes archive and inbox by default routes", async () => {
  const root = await makeVault();
  const routes = JSON.parse(await fs.readFile(path.join(root, "06_AI_SYSTEM", "CONTEXT_ROUTES.json"), "utf8"));
  const inventory = await buildVaultInventory(root, routes);
  assert.ok(inventory.includes("01_CORE/基本原則.md"));
  assert.ok(inventory.includes("03_CASES/愛媛県/松山市.md"));
  assert.equal(inventory.some((x) => x.startsWith("09_ARCHIVE/")), false);
  assert.equal(inventory.some((x) => x.startsWith("99_INBOX/")), false);
  await fs.rm(root, { recursive: true, force: true });
});

test("selector combines core, case, and topic routes deterministically", async () => {
  const root = await makeVault();
  const result = await selectVaultContext("松山市の学校徴収と個人情報を分析", root);
  const paths = result.notes.map((x) => x.path);
  assert.deepEqual(paths.slice(0, 3), [
    "01_CORE/基本原則.md",
    "01_CORE/公私分離.md",
    "03_CASES/愛媛県/松山市.md"
  ]);
  assert.ok(paths.includes("02_LEGAL/個人情報保護法.md"));
  assert.ok(paths.includes("02_LEGAL/PTA会費_学校徴収.md"));
  assert.equal(paths.some((x) => x.startsWith("09_ARCHIVE/")), false);
  await fs.rm(root, { recursive: true, force: true });
});

test("selector respects note and character caps", async () => {
  const root = await makeVault();
  const result = await selectVaultContext("松山市の学校徴収と個人情報", root, {
    maxNotes: 3,
    maxChars: 1000
  });
  assert.equal(result.noteCount, 3);
  assert.ok(result.chars <= 1000);
  await fs.rm(root, { recursive: true, force: true });
});
