const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const views = [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ];
  const results = [];

  for (const view of views) {
    const context = await browser.newContext({
      viewport: { width: view.width, height: view.height },
      locale: 'ja-JP',
      colorScheme: 'light',
    });
    const page = await context.newPage();
    const response = await page.goto('http://127.0.0.1:4173/guide-board.html', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    if (!response || response.status() >= 400) {
      throw new Error(`${view.name}: HTTP ${response ? response.status() : 'no response'}`);
    }

    const data = await page.evaluate(() => {
      const section = document.querySelector('#principal-liability');
      const executive = document.querySelector('#board-executive-brief');
      const img = document.querySelector('#principal-liability-evidence img');
      const caption = document.querySelector('#principal-liability-evidence figcaption');
      if (!section || !executive || !img || !caption) return { missing: true };
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      return {
        missing: false,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        renderedWidth: Math.round(r.width * 10) / 10,
        renderedHeight: Math.round(r.height * 10) / 10,
        naturalRatio: img.naturalWidth / img.naturalHeight,
        renderedRatio: r.width / r.height,
        maxHeight: cs.maxHeight,
        objectFit: cs.objectFit,
        overflow: getComputedStyle(img.closest('figure')).overflow,
        beforeExecutive: Boolean(section.compareDocumentPosition(executive) & Node.DOCUMENT_POSITION_FOLLOWING),
        sectionDisplay: getComputedStyle(section).display,
        hasExplanation: section.textContent.includes('教育委員会が確認すべきなのは、PTAの自治ではなく、学校側の情報利用です'),
        hasNonProsecutionNote: caption.textContent.includes('不起訴'),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      };
    });

    if (data.missing) throw new Error(`${view.name}: required elements missing`);
    if (data.naturalWidth !== 320 || data.naturalHeight !== 539) {
      throw new Error(`${view.name}: source image is ${data.naturalWidth}x${data.naturalHeight}, expected 320x539`);
    }
    if (Math.abs(data.naturalRatio - data.renderedRatio) > 0.01) {
      throw new Error(`${view.name}: image ratio changed; natural=${data.naturalRatio}, rendered=${data.renderedRatio}`);
    }
    if (data.maxHeight !== 'none') throw new Error(`${view.name}: max-height=${data.maxHeight}`);
    if (data.objectFit !== 'contain') throw new Error(`${view.name}: object-fit=${data.objectFit}`);
    if (data.overflow === 'hidden') throw new Error(`${view.name}: figure still hides overflow`);
    if (!data.beforeExecutive) throw new Error(`${view.name}: evidence section is not before executive section`);
    if (data.sectionDisplay === 'none') throw new Error(`${view.name}: evidence section is hidden`);
    if (!data.hasExplanation || !data.hasNonProsecutionNote) throw new Error(`${view.name}: explanatory text incomplete`);
    if (data.horizontalOverflow) throw new Error(`${view.name}: horizontal overflow`);

    await page.locator('#principal-liability').screenshot({
      path: `guide-board-news-audit/${view.name}-section.png`,
    });
    await page.screenshot({
      path: `guide-board-news-audit/${view.name}-page.png`,
      fullPage: false,
    });
    results.push({ view: view.name, ...data });
    await context.close();
  }

  await browser.close();
  fs.writeFileSync('guide-board-news-audit/results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
