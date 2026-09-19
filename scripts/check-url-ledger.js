#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const ledgerPath = path.join(repoRoot, "data", "url-ledger.json");
const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));

const roles = new Set([
  "current-canonical",
  "audience-guide",
  "research-record",
  "source-archive",
  "old/reference",
  "internal/development",
]);

const errors = [];
const entries = Array.isArray(ledger.entries) ? ledger.entries : [];
const prefixes = Array.isArray(ledger.prefix_rules) ? ledger.prefix_rules : [];

const urls = new Set();
for (const entry of entries) {
  if (!entry || typeof entry.url !== "string" || !entry.url.startsWith("/")) {
    errors.push("entry.url must be an absolute site path: " + JSON.stringify(entry));
    continue;
  }
  if (urls.has(entry.url)) errors.push("duplicate URL: " + entry.url);
  urls.add(entry.url);
  if (!roles.has(entry.role)) errors.push("unknown role for " + entry.url + ": " + entry.role);
  for (const key of ["sitemap", "search"]) {
    if (!["index", "reference", "exclude"].includes(entry[key])) {
      errors.push("invalid " + key + " value for " + entry.url + ": " + entry[key]);
    }
  }
  if (entry.role === "old/reference" && !entry.successor) {
    errors.push("old/reference entry needs successor: " + entry.url);
  }
  if (entry.successor && typeof entry.successor === "string" && !entry.successor.startsWith("/")) {
    errors.push("successor must be a site path: " + entry.url);
  }
}
for (const rule of prefixes) {
  if (!rule || typeof rule.prefix !== "string" || !rule.prefix.startsWith("/")) {
    errors.push("prefix rule needs a site path prefix: " + JSON.stringify(rule));
    continue;
  }
  if (!roles.has(rule.role)) errors.push("unknown prefix role for " + rule.prefix + ": " + rule.role);
  for (const key of ["sitemap", "search"]) {
    if (!["index", "reference", "exclude"].includes(rule[key])) {
      errors.push("invalid prefix " + key + " value for " + rule.prefix + ": " + rule[key]);
    }
  }
  if (rule.role === "old/reference" && !rule.successor) {
    errors.push("old/reference prefix needs successor: " + rule.prefix);
  }
}
for (const entry of entries) {
  if (entry.successor && !urls.has(entry.successor) && !prefixes.some(r => entry.successor.startsWith(r.prefix))) {
    errors.push("successor is not represented in ledger: " + entry.url + " -> " + entry.successor);
  }
}

if (errors.length) {
  console.error("URL ledger check failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("URL ledger check passed: " + entries.length + " entries, " + prefixes.length + " prefix rules.");
