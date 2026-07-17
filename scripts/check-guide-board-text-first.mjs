import { chromium } from 'playwright';
import fs from 'node:fs';

const outDir = 'guide-board-text-first-audit';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const item of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: item.width, height: item.height } });
  await page.goto('http://127.0.0.1:4173/guide-board.html', { waitUntil: 'networkidle' });
  const closedSvgVisible = await page.locator('#board-executive-brief details.board-visual-details svg').first().isVisible();
  const data = await page.evaluate(() => {
    const main = document.querySelector('main');
    const mainSections = [...main.children].filter((el) => el.tagName === 'SECTION');
    const executive = document.querySelector('#board-executive-brief');
    const principal = document.querySelector('#principal-liability');
    const boardJp = document.querySelector('#board-jp-guideline');
    const executiveDetails = document.querySelector('#board-executive-brief details.board-visual-details');
    const compactDetails = document.querySelector('#principal-liability details.board-visual-details--compact');
    const newspaper = document.querySelector('.principal-liability-full-evidence img');
    const explanation = document.querySelector('.principal-liability-explanation');
    const heroPhoto = document.querySelector('.page-hero-bg-img');
    const newspaperStyle = getComputedStyle(newspaper);
    return {
      h1Count: document.querySelectorAll('h1').length,
      directSections: mainSections.map((el) => el.id),
      detailsCount: document.querySelectorAll('details.board-visual-details').length,
      executiveOpen: executiveDetails?.open ?? null,
      compactOpen: compactDetails?.open ?? null,
      heroPhotoExists: Boolean(heroPhoto),
      executiveContainsPrincipal: executive?.contains(principal) ?? null,
      principalParentTag: principal?.parentElement?.tagName || '',
      principalParentId: principal?.parentElement?.id || '',
      principalParentClass: principal?.parentElement?.className || '',
      executiveTop: executive?.getBoundingClientRect().top || 0,
      principalTop: principal?.getBoundingClientRect().top || 0,
      boardJpTop: boardJp?.getBoundingClientRect().top || 0,
      newspaperVisible: Boolean(newspaper?.getClientRects().length),
      newspaperNaturalWidth: newspaper?.naturalWidth || 0,
      newspaperNaturalHeight: newspaper?.naturalHeight || 0,
      newspaperRenderedWidth: newspaper?.getBoundingClientRect().width || 0,
      newspaperRenderedHeight: newspaper?.getBoundingClientRect().height || 0,
      newspaperObjectFit: newspaperStyle.objectFit,
      newspaperMaxHeight: newspaperStyle.maxHeight,
      explanationTop: explanation?.getBoundingClientRect().top || 0,
      newspaperTop: newspaper?.getBoundingClientRect().top || 0,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      bodyClass: document.body.className,
    };
  });

  const failures = [];
  if (data.h1Count !== 1) failures.push(`h1=${data.h1Count}`);
  if (data.detailsCount < 2) failures.push(`details=${data.detailsCount}`);
  if (data.executiveOpen !== false || data.compactOpen !== false) failures.push('details not closed');
  if (data.heroPhotoExists) failures.push('hero photo remains');
  if (closedSvgVisible) failures.push('executive SVG visible while closed');
  if (data.executiveContainsPrincipal) failures.push('principal section nested inside executive section');
  if (data.principalParentTag !== 'MAIN') failures.push(`principal parent=${data.principalParentTag}#${data.principalParentId}.${data.principalParentClass}`);
  const requiredOrder = ['principal-liability', 'board-executive-brief', 'board-jp-guideline'];
  for (let i = 0; i < requiredOrder.length; i += 1) {
    if (data.directSections[i] !== requiredOrder[i]) failures.push(`section ${i + 1}=${data.directSections[i] || '(none)'}`);
  }
  if (!(data.principalTop < data.executiveTop && data.executiveTop < data.boardJpTop)) failures.push('visible section order is incorrect');
  if (!data.newspaperVisible) failures.push('newspaper not visible');
  if (data.newspaperNaturalWidth !== 320 || data.newspaperNaturalHeight !== 539) failures.push(`newspaper natural=${data.newspaperNaturalWidth}x${data.newspaperNaturalHeight}`);
  const naturalRatio = 320 / 539;
  const renderedRatio = data.newspaperRenderedWidth / data.newspaperRenderedHeight;
  if (Math.abs(naturalRatio - renderedRatio) > 0.01) failures.push(`newspaper ratio=${renderedRatio}`);
  if (data.newspaperObjectFit !== 'contain') failures.push(`objectFit=${data.newspaperObjectFit}`);
  if (data.newspaperMaxHeight !== 'none') failures.push(`maxHeight=${data.newspaperMaxHeight}`);
  if (!(data.explanationTop < data.newspaperTop)) failures.push('explanation does not precede newspaper');
  if (data.horizontalOverflow) failures.push('horizontal overflow');
  if (!data.bodyClass.includes('guide-board-text-first')) failures.push('body class missing');

  await page.screenshot({ path: `${outDir}/${item.name}-initial.png`, fullPage: true });
  await page.locator('#board-executive-brief details.board-visual-details > summary').click();
  const openVisible = await page.locator('#board-executive-brief svg').first().isVisible();
  if (!openVisible) failures.push('SVG not visible after opening details');
  await page.screenshot({ path: `${outDir}/${item.name}-diagrams-open.png`, fullPage: false });

  results.push({ viewport: item, data, closedSvgVisible, openVisible, failures });
  await page.close();
}

await browser.close();
fs.writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 2));
const allFailures = results.flatMap((r) => r.failures.map((f) => `${r.viewport.name}: ${f}`));
if (allFailures.length) {
  console.error(allFailures.join('\n'));
  process.exit(1);
}
console.log(JSON.stringify(results, null, 2));
