const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const forbidden = [
  { text: 'https://ptaorg.github.io/donate/', label: '旧寄付URL' },
  { text: '運営チェックアプリ', label: '旧運営チェック名称' },
  { text: 'https://www.mext.go.jp/a_menu/sports/syokuiku/1419091.htm', label: '断線した文科省公会計化URL' },
  { text: 'https://www.mext.go.jp/b_menu/shingi/chukyo/chukyo3/079/giji_list/index.htm', label: '断線した中教審特別部会URL' },
  { text: 'https://www.city.osaka.lg.jp/kyoiku/cmsfiles/contents/0000179/179154/3daiitibu.pdf', label: '断線した大阪市PTA手引きPDF URL' },
  { text: 'https://www.city.osaka.lg.jp/kyoiku/page/0000179154.html', label: '断線した大阪市PTA手引き掲載URL' },
  { text: 'https://www.city.osaka.lg.jp/seisakukikakushitsu/page/0000656953.html', label: '断線した大阪市市民の声URL' },
  { text: 'https://cgi.city.yokohama.lg.jp/shimin/kouchou/search/data/37001728.html', label: '断線した横浜市市民の声URL' },
  { text: 'https://elaws.e-gov.go.jp/document?lawid=', label: '旧e-Gov法令URL' },
  { text: '411AC0000000061', label: '誤った消費者契約法の法令番号' },
  { text: '非入会通知書', label: '廃止した非入会通知書' },
  { text: '退会届・非加入届', label: '退会と非加入を混同した案内' },
  { text: 'href="/forms/pta-hinyukai-tsuchi.html"', label: '廃止書式への内部リンク' },
  { text: '加入手続の窓口や提出先は学校・PTAの案内も確認してください', label: '学校をPTA加入手続の窓口にする案内' },
  { text: '非加入意思表示書', label: '非加入者に意思表示書を求める案内' },
  { text: '学校経由にする場合は、学校が取次ぎを受ける根拠と受領先を確認してください', label: '学校をPTA退会手続の取次先にする案内' },
];

const REQUIRED_SOURCE_FRAGMENTS = [
  {
    file: 'forms/pta-hinyukai-tsuchi.html',
    fragments: [
      'content="noindex,follow"',
      '入会していない人に届出は不要です',
      '学校は、誰がPTA会員か、誰が非会員か、誰が退会したかを把握しません',
      'PTAも、加入を申し込んでいない人の一覧を作りません',
    ],
  },
  {
    file: 'forms/pta-taikai-todoke.html',
    fragments: [
      'PTA退会通知書',
      '現会員本人からPTAが自ら設けた窓口へ直接提出します',
      '退会理由、児童生徒の氏名・学年・組、住所、押印は不要です',
    ],
  },
  {
    file: 'guide-parent.html',
    fragments: [
      '入会していない人が、入らないことを届け出る必要はありません',
      '学校・担任・児童生徒を介さず、PTAが自ら設けた窓口へ直接行います',
      '学校は加入状況の照会先・取次先にしません',
      '入会していない人は何も提出しません',
    ],
  },
  {
    file: 'framework.html',
    fragments: [
      'https://www.mext.go.jp/content/20230821-mxt_kenshoku-100003364_4.pdf',
      '学校給食費徴収・管理に関するガイドライン',
    ],
  },
  {
    file: 'administrative-materials.html',
    fragments: [
      'https://www.mext.go.jp/a_menu/shotou/hatarakikata/mext_00349.html',
      '中央教育審議会での審議（平成29年6月22日諮問～平成31年1月25日答申）',
      'https://www.pref.kanagawa.jp/docs/gt2/ptahandbook.html',
      '神奈川県教育委員会「PTA活動のためのハンドブック」',
    ],
  },
  ...['guide-board.html', 'edu-board-separation.html'].map((file) => ({
    file,
    fragments: [
      'https://www.city.matsue.lg.jp/soshikikarasagasu/shimimbu_shiminseikatsusodanka/koho_kocho/4/1/1_5/19768.html',
      'https://cgi.city.yokohama.lg.jp/shimin/kouchou/search/data/37004619.html',
      '校外委員が任意参加になるなら立候補制にしてください',
    ],
  })),
  {
    file: 'cases.html',
    fragments: [
      'https://laws.e-gov.go.jp/law/129AC0000000089#Mp-At_522',
      '滋賀県監査委員「住民監査請求に係る監査結果」（令和8年6月2日公表）',
    ],
  },
  {
    file: 'privacy.html',
    fragments: [
      'https://laws.e-gov.go.jp/law/415AC0000000057',
    ],
  },
  {
    file: 'starter-kit/sources.html',
    fragments: [
      'https://laws.e-gov.go.jp/law/129AC0000000089',
      'https://laws.e-gov.go.jp/law/322AC0000000026',
      'https://laws.e-gov.go.jp/law/324AC0000000207',
      'https://laws.e-gov.go.jp/law/415AC0000000057',
      'https://laws.e-gov.go.jp/law/325AC0000000261',
      'https://laws.e-gov.go.jp/law/412AC0000000061',
    ],
  },
  {
    file: 'PTA運営適正化ガイドブック_第4版_改訂本文.html',
    fragments: [
      'https://laws.e-gov.go.jp/law/321CONSTITUTION',
      'https://laws.e-gov.go.jp/law/129AC0000000089',
      'https://laws.e-gov.go.jp/law/412AC0000000061',
    ],
  },
  {
    file: 'journal/pta-fee-collection-legal-analysis.html',
    fragments: [
      'https://www.mext.go.jp/content/20250616-mxt_zaimu-100002245_2.pdf',
      '学校徴収金の公会計化等の取組の一層の推進について（令和7年4月30日・7初財務第3号・文部科学省）',
    ],
  },
  ...[
    'journal/pta-fee-collection-legal-analysis.html',
    'journal/pta-shokumu-sennen-gimu.html',
  ].map((file) => ({
    file,
    fragments: [
      'https://www.mext.go.jp/content/20230821-mxt_kenshoku-100003364_4.pdf',
      '学校給食費徴収・管理に関するガイドライン（令和元年7月・文部科学省）',
    ],
  })),
];

const REQUIRED_FORM_PDFS = [
  'assets/pdf/pta-membership-inquiry.pdf',
  'assets/pdf/pta-withdrawal-notice.pdf',
  'assets/pdf/personal-data-deletion-request.pdf',
];

const ignoredDirs = new Set(['.git', 'node_modules']);
const findings = [];
const COLLECTION_SCOPE = '76自治体・111件';
const SCOPE_PAGES = [
  'board-responses.html',
  'documents.html',
  'framework.html',
  'index.html',
  'support.html',
];
const TOPIC_COUNTS = [
  ['入会意思確認', '入会意思確認'],
  ['会費徴収・委任', '会費徴収'],
  ['個人情報・名簿', '個人情報の取扱い'],
  ['学校施設利用', '学校施設利用'],
  ['教委指導・是正', '教育委員会の指導・是正'],
];

function normalizeText(value) {
  return String(value)
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

function decodeHtml(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };
  return String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi, (match, entity) => {
      if (entity[0] !== '#') return named[entity.toLowerCase()] || match;
      const radix = entity[1].toLowerCase() === 'x' ? 16 : 10;
      const valueText = radix === 16 ? entity.slice(2) : entity.slice(1);
      return String.fromCodePoint(parseInt(valueText, radix));
    });
}

function japaneseDate(value) {
  const parts = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return parts ? `${parts[1]}年${Number(parts[2])}月${Number(parts[3])}日` : '';
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.isFile() || path.extname(entry.name) !== '.html') continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const rule of forbidden) {
      if (text.includes(rule.text)) {
        findings.push(`${path.relative(root, full)}: ${rule.label} (${rule.text})`);
      }
    }
  }
}

walk(root);

for (const rel of REQUIRED_FORM_PDFS) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    findings.push(`${rel}: PDF書式がありません`);
    continue;
  }
  const bytes = fs.readFileSync(full);
  if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    findings.push(`${rel}: PDFヘッダーが不正です`);
  }
  if (bytes.length < 3000) {
    findings.push(`${rel}: 仮置き又は内容不足の可能性があります (${bytes.length} bytes)`);
  }
}

for (const rule of REQUIRED_SOURCE_FRAGMENTS) {
  const text = fs.readFileSync(path.join(root, rule.file), 'utf8');
  for (const fragment of rule.fragments) {
    if (!text.includes(fragment)) {
      findings.push(`${rule.file}: 確認済みの公式資料URL又は正式表示がありません (${fragment})`);
    }
  }
}

const boardDataPath = path.join(root, 'data', 'board-responses.json');
const boardData = JSON.parse(fs.readFileSync(boardDataPath, 'utf8'));
const responses = Array.isArray(boardData.responses) ? boardData.responses : [];
const publishedScope = `${boardData.totalMunicipalities}自治体・${boardData.totalResponses}件`;

const indexSandbox = { window: {} };
try {
  vm.runInNewContext(
    fs.readFileSync(path.join(root, 'data', 'board-responses-index.js'), 'utf8'),
    indexSandbox,
    { filename: 'data/board-responses-index.js' },
  );
} catch (error) {
  findings.push(`data/board-responses-index.js: JavaScriptを読み込めません (${error.message})`);
}
const indexData = indexSandbox.window.PTA_BOARD_RESPONSE_INDEX || {};
const indexDetails = Array.isArray(indexData.details) ? indexData.details : [];

if (responses.length !== boardData.totalResponses) {
  findings.push(`data/board-responses.json: totalResponses=${boardData.totalResponses} と responses=${responses.length} が一致しません`);
}

if (new Set(responses.map((response) => response.municipality)).size !== boardData.totalMunicipalities) {
  findings.push('data/board-responses.json: 自治体の実数と totalMunicipalities が一致しません');
}

if (indexData.totalMunicipalities !== boardData.totalMunicipalities) {
  findings.push('data/board-responses-index.js: totalMunicipalities がJSONと一致しません');
}

if (indexDetails.length !== responses.length) {
  findings.push(`data/board-responses-index.js: details=${indexDetails.length} とJSON responses=${responses.length} が一致しません`);
}

const indexByNumber = new Map();
for (const detail of indexDetails) {
  if (indexByNumber.has(detail.no)) findings.push(`data/board-responses-index.js: No.${detail.no} が重複しています`);
  indexByNumber.set(detail.no, detail);
}

const responseNumbers = new Set();
const responseUrls = new Set();
const directEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const directPhone = /\b0\d{1,4}[-‐‑–—ー]\d{1,4}[-‐‑–—ー]\d{3,4}\b/;
const directPostcode = /〒?\s*\d{3}[-‐‑–—ー]\d{4}/;
const streetAddress = /(?:都|道|府|県|市|区|町|村).{0,60}(?:(?:[0-9０-９一二三四五六七八九十]+丁目)|(?:[0-9０-９一二三四五六七八九十]+番地)|(?:[0-9０-９一二三四五六七八九十]+番(?:[0-9０-９一二三四五六七八九十-]*号)?)|(?:通.{0,30}(?:上る|下る).*[0-9０-９]))/u;
const likelyNamePatterns = [
  /(?:^|[の・ 　])([\p{Script=Han}々ヶ]{1,4}(?:[ \u3000]+[\p{Script=Han}々ヶ]{1,4})?)(?=と申します)/u,
  /(?:教育長|課長|係長|主幹|指導主事|校長|会長)[ \u3000:：()（）]*(?!\[氏名省略\])([\p{Script=Han}々ヶ]{1,4}(?:[ \u3000]+[\p{Script=Han}々ヶ]{1,4})?)[ \u3000]*$/u,
  /(?:担当者?|御担当者?)[ \u3000:：()（）]*(?!\[氏名省略\])([\p{Script=Han}々ヶ]{2,4}(?:[ \u3000]+[\p{Script=Han}々ヶ]{1,4})?)(?:[ \u3000]*(?:様|氏))?[ \u3000]*$/u,
];

for (const response of responses) {
  if (responseNumbers.has(response.no)) findings.push(`data/board-responses.json: No.${response.no} が重複しています`);
  responseNumbers.add(response.no);
  if (responseUrls.has(response.url)) findings.push(`data/board-responses.json: URLが重複しています (${response.url})`);
  responseUrls.add(response.url);

  const detail = indexByNumber.get(response.no);
  if (!detail) {
    findings.push(`data/board-responses-index.js: No.${response.no} のdetailsがありません`);
  } else {
    for (const key of ['municipality', 'prefecture', 'type', 'typeLabel', 'date', 'sourceFile', 'chars', 'body']) {
      if (detail[key] !== response[key]) {
        findings.push(`data/board-responses-index.js: No.${response.no} の${key}がJSONと一致しません`);
      }
    }
  }

  let pagePath = '';
  try {
    const pageUrl = new URL(response.url);
    if (pageUrl.origin !== 'https://ptaorg.com') throw new Error('ptaorg.com以外のURL');
    pagePath = pageUrl.pathname.replace(/^\/+/, '');
  } catch (error) {
    findings.push(`data/board-responses.json: No.${response.no} のURLが不正です (${error.message})`);
  }

  if (pagePath) {
    const fullPagePath = path.join(root, pagePath);
    if (!fs.existsSync(fullPagePath)) {
      findings.push(`${pagePath}: No.${response.no} の個別ページがありません`);
    } else {
      const pageHtml = fs.readFileSync(fullPagePath, 'utf8');
      const bodyMatch = pageHtml.match(/<div class="body-card">([\s\S]*?)<\/div>\s*<div class="note">/);
      if (!bodyMatch) {
        findings.push(`${pagePath}: 回答本文を抽出できません`);
      } else if (normalizeText(decodeHtml(bodyMatch[1])) !== normalizeText(response.body)) {
        findings.push(`${pagePath}: 回答本文がJSONのNo.${response.no}と一致しません`);
      }
    }
  }

  for (const [lineNumber, line] of String(response.body).split('\n').entries()) {
    if (directEmail.test(line)) findings.push(`data/board-responses.json: No.${response.no} ${lineNumber + 1}行目にメールアドレス候補があります`);
    if (directPhone.test(line)) findings.push(`data/board-responses.json: No.${response.no} ${lineNumber + 1}行目に電話番号候補があります`);
    if (directPostcode.test(line)) findings.push(`data/board-responses.json: No.${response.no} ${lineNumber + 1}行目に郵便番号候補があります`);
    if (!line.includes('[所在地省略]') && streetAddress.test(line)) {
      findings.push(`data/board-responses.json: No.${response.no} ${lineNumber + 1}行目に所在地候補があります`);
    }
    for (const pattern of likelyNamePatterns) {
      const match = line.match(pattern);
      if (match && match[1] !== '者様') {
        findings.push(`data/board-responses.json: No.${response.no} ${lineNumber + 1}行目に担当者名候補があります`);
        break;
      }
    }
  }
}

for (const rel of SCOPE_PAGES) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!html.includes(COLLECTION_SCOPE)) {
    findings.push(`${rel}: 収集・分類総数 (${COLLECTION_SCOPE}) の表示がありません`);
  }
  if (!html.includes(publishedScope)) {
    findings.push(`${rel}: 本文公開版 (${publishedScope}) の表示がありません`);
  }
}

const boardHtml = fs.readFileSync(path.join(root, 'board-responses.html'), 'utf8');
const generatedDate = japaneseDate(boardData.generatedAt);
if (!generatedDate || !boardHtml.includes(generatedDate)) {
  findings.push(`board-responses.html: データ生成日 (${boardData.generatedAt || '未設定'}) の表示がありません`);
}

if (!boardData.privacyReviewedAt || indexData.privacyReviewedAt !== boardData.privacyReviewedAt) {
  findings.push('回答データ: privacyReviewedAt がJSONと索引で一致しません');
}
const privacyReviewDate = japaneseDate(boardData.privacyReviewedAt);
if (!privacyReviewDate || !boardHtml.includes(`公開用マスキングは${privacyReviewDate}に再確認しました`)) {
  findings.push(`board-responses.html: マスキング再確認日 (${boardData.privacyReviewedAt || '未設定'}) の表示がありません`);
}

for (const [topic, displayedLabel] of TOPIC_COUNTS) {
  const count = responses.filter((response) => Array.isArray(response.topics) && response.topics.includes(topic)).length;
  if (!boardHtml.includes(`${displayedLabel}に触れているものが${count}件`)) {
    findings.push(`board-responses.html: ${topic} の集計件数 (${count}件) が本文と一致しません`);
  }
}

const archiveHtml = fs.readFileSync(path.join(root, 'national-archive.html'), 'utf8');
const staleAtsugiFragments = [
  'const missingAtsugi=',
  'const elementary=',
  'const junior=',
  'function cardHtml',
  '入会申込書不存在（開示請求で送付なし）',
  '入会申込書が送付されていないものは、PTA自体がない場合を除き、入会申込書不存在として扱います。',
];
for (const fragment of staleAtsugiFragments) {
  if (archiveHtml.includes(fragment)) findings.push(`national-archive.html: 旧厚木市表示が残っています (${fragment})`);
}
if (!archiveHtml.includes('資料未掲載と文書不存在は区別して表示します。')) {
  findings.push('national-archive.html: 資料未掲載と文書不存在を区別する説明がありません');
}

const proseCss = fs.readFileSync(path.join(root, 'css', 'prose.css'), 'utf8');
const comparisonCssTokens = [
  'body[data-content-mode="prose"].personnel-editorial .scope-grid',
  'body[data-content-mode="prose"].facilities-editorial .safes',
  'body[data-content-mode="prose"].fee-editorial .transition-options',
  'body[data-content-mode="prose"].fee-editorial .triple-problem',
  'grid-template-columns: repeat(2, minmax(0, 1fr)) !important;',
  'grid-template-columns: repeat(3, minmax(0, 1fr)) !important;',
];
for (const token of comparisonCssTokens) {
  if (!proseCss.includes(token)) {
    findings.push(`css/prose.css: 比較レイアウトの保護指定がありません (${token})`);
  }
}
const comparisonCssVersion = '/css/prose.css?v=20260814-2';
for (const rel of ['personnel.html', 'facilities.html', 'fee-collection.html']) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!html.includes(comparisonCssVersion)) {
    findings.push(`${rel}: 比較レイアウト修正版CSSを読み込んでいません`);
  }
}

const theoryPath = path.join(root, 'journal', 'pta-unified-legal-theory.html');
const theoryHtml = fs.readFileSync(theoryPath, 'utf8');
const incorrectTheorySource = 'https://www.mext.go.jp/content/20260303-mxt_syoto01-000046407_1.pdf';
const staleTheoryLabels = [
  '文部科学省令和8年PTA運営改善報告書',
  '文部科学省令和8年PTA運営改善事例調査報告書',
];
if (theoryHtml.includes(incorrectTheorySource)) {
  findings.push('journal/pta-unified-legal-theory.html: 学校徴収金通知ではない文科省URLが残っています');
}
for (const label of staleTheoryLabels) {
  if (theoryHtml.includes(label)) {
    findings.push(`journal/pta-unified-legal-theory.html: 訂正前の資料名が残っています (${label})`);
  }
}
const correctedTheoryPdf = 'assets/documents/journal/pta-unified-legal-theory-v1-with-errata-20260809.pdf';
if (!theoryHtml.includes(`/${correctedTheoryPdf}`) || !fs.existsSync(path.join(root, correctedTheoryPdf))) {
  findings.push('journal/pta-unified-legal-theory.html: 訂正表付きPDFのリンク又はファイルがありません');
}
if (!theoryHtml.includes('令和7年度「令和の時代」におけるPTA運営改善支援にかかる委託事業報告書（令和8年公表）')) {
  findings.push('journal/pta-unified-legal-theory.html: PTA運営改善報告書の正式名称がありません');
}

if (findings.length) {
  console.error('Content consistency check failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Content consistency check passed.');
