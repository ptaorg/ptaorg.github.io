import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('published sitemap paths resolve to matching production canonicals', () => {
  const primary = read('sitemap.xml');
  const production = 'https://ptaorg.com';
  const locations = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const primaryUrls = locations(primary);
  assert.ok(primaryUrls.length >= 750);
  assert.equal(new Set(primaryUrls).size, primaryUrls.length);

  for (const file of ['sitemap.xml', 'sitemap-research.xml']) {
    assert.ok(read('robots.txt').includes(`Sitemap: ${production}/${file}`));
    for (const location of locations(read(file))) {
      const url = new URL(location);
      assert.equal(url.origin, production);
      const pathname = decodeURIComponent(url.pathname).slice(1);
      const page = pathname === '' || pathname.endsWith('/') ? pathname + 'index.html' : pathname;
      assert.ok(read(page).includes(`<link rel="canonical" href="${location}">`), page);
    }
  }
});

test('legacy aliases retain query and fragment under either hosting path', () => {
  for (const basePath of ['/', '/ptaorg-site-next/']) {
    for (const [from, to] of [['parents', 'guide-parent.html'], ['fee-collection', 'fee-collection.html'], ['no/such/page', null]]) {
      let destination;
      runInNewContext(read('assets/legacy-redirects.js'), {
        URL,
        document: { baseURI: 'https://ptaorg.com' + basePath },
        location: {
          pathname: basePath + from,
          search: '?source=test',
          hash: '#main',
          replace(url) { destination = url; }
        }
      });
      assert.equal(destination, to ? basePath + to + '?source=test#main' : undefined);
    }
  }
});
