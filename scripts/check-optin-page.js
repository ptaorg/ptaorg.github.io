const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const audit = {};
  const routes = [
    'index.html','guide-parent.html','guide-pta.html','guide-board.html','guide-research.html',
    'membership.html','privacy.html','fee-collection.html','research-index.html','documents.html',
    'submission-kit.html','key-materials.html','journal.html',
    'journal/pta-membership-optin-record.html','journal/optout-invalidity.html'
  ];
  fs.mkdirSync('optin-priority-audit', { recursive: true });

  for (const profile of [
    {name:'desktop', viewport:{width:1440,height:1000}},
    {name:'mobile', viewport:{width:390,height:844}},
  ]) {
    const page = await browser.newPage({ viewport: profile.viewport });
    await page.goto('http://127.0.0.1:4173/pta-membership-optin.html', { waitUntil: 'networkidle' });
    const data = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('.op-figure img')].map(img => ({
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        width: img.getBoundingClientRect().width,
        height: img.getBoundingClientRect().height,
      }));
      const pdf = document.querySelector('a[href$="pta-membership-optin-only-board-school-20260710.pdf"]');
      return {
        title: document.title,
        h1: document.querySelectorAll('h1').length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        figures: imgs.length,
        images: imgs,
        matrix: !!document.querySelector('.op-matrix'),
        article69: document.getElementById('article69')?.innerText || '',
        collection: document.getElementById('collection')?.innerText || '',
        pdfHref: pdf?.getAttribute('href') || '',
      };
    });
    audit[profile.name] = data;
    if (data.h1 !== 1) failures.push(`${profile.name}: h1=${data.h1}`);
    if (data.overflow > 1) failures.push(`${profile.name}: horizontal overflow=${data.overflow}`);
    if (data.figures !== 4) failures.push(`${profile.name}: figures=${data.figures}`);
    data.images.forEach((img, i) => {
      if (!img.complete || img.naturalWidth < 850 || img.naturalHeight < 750) failures.push(`${profile.name}: image ${i+1} incomplete ${JSON.stringify(img)}`);
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      const renderedRatio = img.width / img.height;
      if (Math.abs(naturalRatio - renderedRatio) > 0.02) failures.push(`${profile.name}: image ${i+1} ratio mismatch`);
    });
    if (!data.matrix) failures.push(`${profile.name}: matrix missing`);
    for (const token of ['第1号','第2号','第3号','第4号','臨時的','法令に基づく場合']) {
      if (!data.article69.includes(token)) failures.push(`${profile.name}: article69 missing ${token}`);
    }
    for (const token of ['会員・債務者の確定','口座振替の実行','未納・不能の管理','返金・帳簿・決算']) {
      if (!data.collection.includes(token)) failures.push(`${profile.name}: collection missing ${token}`);
    }
    if (!data.pdfHref) failures.push(`${profile.name}: PDF link missing`);
    await page.screenshot({ path:`optin-priority-audit/${profile.name}-full.png`, fullPage:true });
    await page.locator('#article69').screenshot({ path:`optin-priority-audit/${profile.name}-article69.png` });
    await page.close();
  }

  const routePage = await browser.newPage({ viewport: {width:1280,height:900} });
  audit.routes = {};
  for (const route of routes) {
    await routePage.goto(`http://127.0.0.1:4173/${route}`, { waitUntil: 'domcontentloaded' });
    const result = await routePage.evaluate(() => ({
      banners: document.querySelectorAll('a.priority-optin-route[href="/pta-membership-optin.html"]').length,
      css: [...document.querySelectorAll('link[rel="stylesheet"]')].some(l => l.href.includes('/css/priority-optin.css')),
    }));
    audit.routes[route] = result;
    if (result.banners !== 1) failures.push(`${route}: banners=${result.banners}`);
    if (!result.css) failures.push(`${route}: priority css missing`);
  }
  await routePage.close();

  const response = await fetch('http://127.0.0.1:4173/assets/documents/pta-membership-optin-only-board-school-20260710.pdf');
  audit.pdf = { status: response.status, contentType: response.headers.get('content-type'), length: Number(response.headers.get('content-length') || 0) };
  if (!response.ok) failures.push(`PDF status=${response.status}`);
  if (!String(audit.pdf.contentType).includes('application/pdf')) failures.push(`PDF content-type=${audit.pdf.contentType}`);

  fs.writeFileSync('optin-priority-audit/audit.json', JSON.stringify(audit, null, 2));
  if (failures.length) {
    fs.writeFileSync('optin-priority-audit/failures.txt', failures.join('\n'));
    console.error(failures.join('\n'));
    await browser.close();
    process.exit(1);
  }
  console.log(JSON.stringify(audit, null, 2));
  await browser.close();
})().catch(err => {
  fs.mkdirSync('optin-priority-audit', { recursive: true });
  fs.writeFileSync('optin-priority-audit/runtime-error.txt', String(err.stack || err));
  console.error(err);
  process.exit(1);
});
