#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { formatVaultContext, selectVaultContext } from "./core.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JEV_CONFIG = path.resolve(HERE, "../jev/config.json");

function parseArgs(argv) {
  const args = {
    task: null,
    vault: process.env.PTA_CONTEXT_VAULT ?? null,
    json: false,
    pathsOnly: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--task") args.task = argv[++i];
    else if (arg === "--vault") args.vault = argv[++i];
    else if (arg === "--json") args.json = true;
    else if (arg === "--paths-only") args.pathsOnly = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function usage() {
  return `PTA local context query (read-only)

Usage:
  node tools/context-engine/query.mjs --task "<task>" --vault "<Obsidian Vault path>"
  PTA_CONTEXT_VAULT="<Vault path>" node tools/context-engine/query.mjs --task "<task>"
  node tools/context-engine/query.mjs --task "<task>" --paths-only
  node tools/context-engine/query.mjs --task "<task>" --json

The Vault is never copied into the repository and this command never writes to the Vault.`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return console.log(usage());
  if (!args.task) throw new Error("--task is required.");
  if (!args.vault) throw new Error("--vault or PTA_CONTEXT_VAULT is required.");

  const jevConfig = JSON.parse(await fs.readFile(JEV_CONFIG, "utf8"));
  const contextConfig = jevConfig.contextEngine ?? {};
  if (contextConfig.enabled === false) throw new Error("Context engine is disabled by JEV config.");

  const result = await selectVaultContext(args.task, args.vault, {
    routeConfigPath: contextConfig.routeConfig ?? "06_AI_SYSTEM/CONTEXT_ROUTES.json",
    maxNotes: contextConfig.maxNotes ?? 10,
    maxChars: contextConfig.maxChars ?? 50000
  });

  if (args.pathsOnly) {
    for (const note of result.notes) {
      console.log(`${note.path}\t${note.score}\t${note.reasons.join("; ")}`);
    }
    return;
  }
  if (args.json) return console.log(JSON.stringify(result, null, 2));

  console.log(`# Context bundle: ${result.task}\n`);
  console.log(formatVaultContext(result));
}

main().catch((error) => {
  console.error(`Context query error: ${error.message}`);
  process.exitCode = 1;
});
