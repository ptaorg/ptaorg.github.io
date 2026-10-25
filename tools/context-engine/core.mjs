import fs from "node:fs/promises";
import path from "node:path";

function normalize(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase();
}

function safeRel(value) {
  return String(value ?? "").replaceAll("\\", "/").replace(/^\.\//, "");
}

function isInside(root, abs) {
  const resolvedRoot = path.resolve(root);
  const resolvedAbs = path.resolve(abs);
  return resolvedAbs === resolvedRoot || resolvedAbs.startsWith(resolvedRoot + path.sep);
}

function absFromRel(root, rel) {
  const safe = safeRel(rel);
  if (!safe || safe.startsWith("../") || path.isAbsolute(safe)) {
    throw new Error(`Unsafe context path: ${rel}`);
  }
  const abs = path.resolve(root, ...safe.split("/"));
  if (!isInside(root, abs)) throw new Error(`Context path escapes vault: ${rel}`);
  return abs;
}

export async function loadVaultRouteConfig(vaultRoot, relativePath = "06_AI_SYSTEM/CONTEXT_ROUTES.json") {
  const root = path.resolve(vaultRoot);
  const abs = absFromRel(root, relativePath);
  const config = JSON.parse(await fs.readFile(abs, "utf8"));
  if (!Array.isArray(config.alwaysInclude) || !Array.isArray(config.routes)) {
    throw new Error("Vault context route config is invalid.");
  }
  return config;
}

export async function buildVaultInventory(vaultRoot, routeConfig) {
  const root = path.resolve(vaultRoot);
  const excluded = new Set(routeConfig.excludedDirectories ?? []);
  const out = [];

  async function walk(abs, rel) {
    const entries = await fs.readdir(abs, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    for (const entry of entries) {
      const childRel = rel ? path.posix.join(rel, entry.name) : entry.name;
      if (entry.isDirectory()) {
        const excludedPath = [...excluded].some((name) =>
          entry.name === name || childRel === name || childRel.startsWith(name + "/")
        );
        if (!excludedPath) await walk(path.join(abs, entry.name), childRel);
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".md") {
        out.push(childRel);
      }
    }
  }

  await walk(root, "");
  return out;
}

function titleTerms(rel) {
  const parts = safeRel(rel).replace(/\.md$/i, "").split("/");
  const base = parts.at(-1) ?? "";
  return [...new Set([base, base.replaceAll("_", " "), ...parts])].filter((x) => x.length >= 2);
}

export async function selectVaultContext(task, vaultRoot, {
  routeConfigPath = "06_AI_SYSTEM/CONTEXT_ROUTES.json",
  maxNotes = 10,
  maxChars = 50000
} = {}) {
  const root = path.resolve(vaultRoot);
  const routeConfig = await loadVaultRouteConfig(root, routeConfigPath);
  const inventory = await buildVaultInventory(root, routeConfig);
  const inventorySet = new Set(inventory);
  const haystack = normalize(task);
  const selected = new Map();

  function add(rel, score, reason) {
    const safe = safeRel(rel);
    if (!inventorySet.has(safe)) return;
    const prev = selected.get(safe);
    if (!prev || score > prev.score) {
      selected.set(safe, { path: safe, score, reasons: [reason] });
    } else if (!prev.reasons.includes(reason)) {
      prev.reasons.push(reason);
    }
  }

  for (const rel of routeConfig.alwaysInclude ?? []) add(rel, 1000, "alwaysInclude");

  for (const route of routeConfig.routes ?? []) {
    const hits = (route.keywords ?? []).filter((keyword) => haystack.includes(normalize(keyword)));
    if (!hits.length) continue;
    for (const rel of route.files ?? []) {
      add(rel, 700 + hits.length * 10, `route:${route.id} [${hits.join(", ")}]`);
    }
  }

  for (const rel of inventory) {
    for (const term of titleTerms(rel)) {
      if (haystack.includes(normalize(term))) add(rel, 900, `title:${term}`);
    }
  }

  for (const rel of inventory.filter((x) => x.startsWith("03_CASES/"))) {
    const content = await fs.readFile(absFromRel(root, rel), "utf8");
    const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    if (heading && haystack.includes(normalize(heading))) {
      add(rel, 950, `case-heading:${heading}`);
    }
  }

  const ordered = [...selected.values()].sort((a, b) =>
    b.score - a.score || a.path.localeCompare(b.path, "ja")
  );

  const effectiveMaxNotes = Math.max(1, Number(maxNotes) || 10);
  const effectiveMaxChars = Math.max(1000, Number(maxChars) || 50000);
  const notes = [];
  let used = 0;

  for (const item of ordered) {
    if (notes.length >= effectiveMaxNotes || used >= effectiveMaxChars) break;
    const content = await fs.readFile(absFromRel(root, item.path), "utf8");
    const slice = content.slice(0, Math.max(0, effectiveMaxChars - used));
    if (!slice) break;
    used += slice.length;
    notes.push({ ...item, chars: slice.length, content: slice });
  }

  return {
    routeVersion: routeConfig.version ?? null,
    task: String(task ?? ""),
    noteCount: notes.length,
    chars: used,
    notes
  };
}

export function formatVaultContext(result) {
  if (!result?.notes?.length) return "";
  return result.notes.map((note) =>
    `\n--- VAULT NOTE: ${note.path} | score=${note.score} | ${note.reasons.join("; ")} ---\n${note.content.trim()}`
  ).join("\n");
}
