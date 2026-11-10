// The production 404 page's legacy aliases and extensionless routes.
(() => {
  const basePath = new URL(document.baseURI).pathname.replace(/\/$/, '');
  const redirects = {
    '/>': '/',
    '/shizuoka-incident.html': '/guide-board.html',
    '/教育委員会/公益性と言う名の罠': '/guide-board.html',
    '/ppc-points.html<https://ptaorg.com/ppc-points.html': '/ppc-points.html',

    '/parents': '/guide-parent.html',
    '/parents.html': '/guide-parent.html',
    '/parent': '/guide-parent.html',
    '/parent.html': '/guide-parent.html',
    '/guide-parents': '/guide-parent.html',
    '/guide-parents.html': '/guide-parent.html',
    '/保護者の皆様': '/guide-parent.html',
    '/保護者の皆様.html': '/guide-parent.html',
    '/保護者の方へ': '/guide-parent.html',
    '/保護者の方へ.html': '/guide-parent.html',
    '/保護者向け': '/guide-parent.html',
    '/保護者向け.html': '/guide-parent.html',
    '/保護者向けガイド': '/guide-parent.html',
    '/保護者向けガイド.html': '/guide-parent.html',

    '/officers': '/guide-pta.html',
    '/officers.html': '/guide-pta.html',
    '/pta-officers': '/guide-pta.html',
    '/pta-officers.html': '/guide-pta.html',
    '/pta': '/guide-pta.html',
    '/pta.html': '/guide-pta.html',

    '/board': '/guide-board.html',
    '/board.html': '/guide-board.html',
    '/boards': '/guide-board.html',
    '/boards.html': '/guide-board.html',
    '/education-board': '/guide-board.html',
    '/education-board.html': '/guide-board.html',

    '/laws': '/law-map.html',
    '/laws.html': '/law-map.html',
    '/law': '/law-map.html',
    '/law.html': '/law-map.html',

    '/articles': '/journal.html',
    '/articles.html': '/journal.html',
    '/article': '/journal.html',
    '/article.html': '/journal.html',

    '/responses': '/board-responses.html',
    '/responses.html': '/board-responses.html',
    '/response': '/board-responses.html',
    '/response.html': '/board-responses.html',
    '/education-board-responses': '/board-responses.html',
    '/education-board-responses.html': '/board-responses.html',

    '/archives': '/national-archive.html',
    '/archives.html': '/national-archive.html',
    '/archive.html': '/national-archive.html',
    '/school-archive': '/national-archive.html',
    '/school-archive.html': '/national-archive.html',

    '/docs': '/documents.html',
    '/docs.html': '/documents.html',
    '/materials': '/documents.html',
    '/materials.html': '/documents.html',

    '/membership-guide': '/membership.html',
    '/membership-guide.html': '/membership.html',
    '/fee': '/fee-collection.html',
    '/fee.html': '/fee-collection.html',
    '/personal-info': '/privacy.html',
    '/personal-info.html': '/privacy.html',
    '/privacy-policy': '/privacy.html',
    '/privacy-policy.html': '/privacy.html',
    '/personnel-duty': '/personnel.html',
    '/personnel-duty.html': '/personnel.html',
    '/facility': '/facilities.html',
    '/facility.html': '/facilities.html',
    '/school-pta-separation': '/edu-board-separation.html',
    '/school-pta-separation.html': '/edu-board-separation.html',
    '/research': '/research-index.html',
    '/research.html': '/research-index.html',
    '/reality': '/reality.html',
    '/reports': '/report.html',
    '/reports.html': '/report.html',
    '/contact-us': '/contact.html',
    '/contact-us.html': '/contact.html',

    '/pta/journal/third-party-consent.html': '/journal/third-party-consent.html',
    '/pta/journal/work-style-reform.html': '/journal/work-style-reform.html',
    '/pta/journal/school-fee-illegality.html': '/journal/school-fee-separation.html',
    '/pta/journal/optout-invalidity.html': '/journal/optout-invalidity.html',
    '/pta/journal/non-member-info.html': '/journal/nonmember-info.html',
    '/pta/journal/consumer-agency.html': '/journal/consumer-contract.html'
  };
  const knownHtmlPages = {
    'administrative-materials.html': true,
    'board-responses.html': true,
    'cases.html': true,
    'compliance.html': true,
    'contact.html': true,
    'documents.html': true,
    'edu-board-separation.html': true,
    'facilities.html': true,
    'fee-collection.html': true,
    'guide-board.html': true,
    'guide-parent.html': true,
    'guide-pta.html': true,
    'guide-research.html': true,
    'guideline.html': true,
    'journal.html': true,
    'journal/consumer-contract.html': true,
    'journal/nonmember-info.html': true,
    'journal/optout-invalidity.html': true,
    'journal/school-fee-separation.html': true,
    'journal/third-party-consent.html': true,
    'journal/work-style-reform.html': true,
    'journal/yokohama-notice-1965.html': true,
    'law-map.html': true,
    'membership.html': true,
    'national-archive.html': true,
    'personnel.html': true,
    'popc.html': true,
    'privacy.html': true,
    'proper-management.html': true,
    'report.html': true,
    'support.html': true,
    'timeline.html': true
  };

  let path = location.pathname.slice(basePath.length) || '/';
  try { path = decodeURI(path); } catch { /* Keep malformed escapes as received. */ }
  const key = path.replace(/\/index\.html$/i, '').replace(/\/+$/, '').toLowerCase() || '/';
  const extensionless = key.slice(1) + '.html';
  const target = redirects[key] || (Object.hasOwn(knownHtmlPages, extensionless) ? '/' + extensionless : '');
  if (target) location.replace(basePath + target + location.search + location.hash);
})();
