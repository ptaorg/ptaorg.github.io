/* Validate the publishable extract of the 2026-10-26 national PTA study.
   This is evidence metadata, not a legal verdict or a source archive. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "research-survey-20261026.json"), "utf8"));
assert.equal(data.version, 1);
assert.equal(data.coverage.registered, 48);
assert.equal(data.coverage.primaryVerified, 39);
assert.equal(data.coverage.fixedPopulation, 67);
assert.equal(data.coverage.fixedPopulationVerified, 33);
assert.equal(data.records.length, 48);
const counts = {};
const names = new Set();
for (const record of data.records) {
  const key = record.prefecture + "|" + record.name;
  assert.ok(!names.has(key), "Duplicate jurisdiction " + key);
  names.add(key);
  assert.ok(record.prefecture && record.name && record.schoolType);
  counts[record.evidence] = (counts[record.evidence] || 0) + 1;
  assert.match(record.reviewed, /^\d{4}-\d{2}-\d{2}$/);
  for (const url of record.sourceUrls) {
    assert.match(url, /^https:\/\//);
    assert.ok(!/(?:mail\.google\.com|drive\.google\.com|docs\.google\.com|localhost)/i.test(url), "Private URL: " + key);
  }
  if (!record.publicDetails) {
    assert.equal(record.sourceUrls.length, 0);
    for (const field of ["publicPosition", "activity", "legalAssessment", "sourceIds", "document"]) {
      assert.ok(!Object.hasOwn(record, field), "Private detail leaked: " + key + "/" + field);
    }
  }
}
assert.deepEqual(
  counts,
  { "原本確認": 39, "公式本文確認・原本保存未了": 2, "検索本文のみ": 6, "候補資料": 1 }
);
const serialized = JSON.stringify(data);
assert.ok(!/mail\.google\.com|drive\.google\.com|docs\.google\.com|受領メール添付/i.test(serialized), "Private URL or file leaked");
console.log("National PTA study: 48 subjects, 39 primary-source records, no private URLs/details.");
