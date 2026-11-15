/**
 * PTA自治体・学校別評価書 v1.2.0 — 保護者向け法令・最低限是正事項・状態色の共通判定。
 * 法令そのもの、事務の帰属、公法上の権限、個情法61→69の順を維持する。
 * Observation confirmed_no =「適正」ではない。資料不足 =「問題なし」ではない。
 * Pure module: Node/browser 同一の結果。個別の違法性は自動認定しない。
 */
export const PARENT_REPORT_POLICY_VERSION = '1.2.0';
export const STATUS = Object.freeze({
  urgent: Object.freeze({tone:'urgent',label:'早急な調査・改善が必要',description:'具体的な学校関与や強制につながり得る制度の記載を確認'}),
  review: Object.freeze({tone:'review',label:'重要な確認と改善検討が必要',description:'一次資料に問題を示唆する記載があるが実施・適用要件が未確定'}),
  unknown: Object.freeze({tone:'unknown',label:'資料不足・判断保留',description:'適正とも違法とも判断できない'}),
  verified: Object.freeze({tone:'verified',label:'主要項目の適正を資料で確認',description:'対象年度と確認範囲を限定した実証的な評価。将来の無違反を保証しない'})
});
export const POSITIVE_CHECKS = Object.freeze([
  'voluntaryJoining', // 加入対象者本人の意思と会員管理
  'feeClaimAndCollection', // 会員に限る請求とPTA自身による徴収/無会費
  'schoolTaskSeparation', // 公務・PTA内部事務の分離
  'personalData', // 学校所掌→61→69、PTA自身の個人情報取扱い
  'officerConsent', // 任意の役員就任
  'staffDuties', // 公務と私的団体業務・服務
  'moneyCustody', // 実資金の保管者・送金・会計区分
  'childEqualTreatment' // 子どもへの公平な取扱い
]);
const CONCERN_AXES = new Set([
  'school_collection_of_pta_fee','school_personal_data_for_pta',
  'officer_selection_pressure','sensitive_exemption_questions',
  'teacher_internal_pta_admin','school_pta_governance_overlap'
]);
const TRIGGERED = new Set(['confirmed_yes','indication','conflicting']);
export const REVIEW_ORDER = Object.freeze([
  'task_authority', 'membership_contract', 'fee_claim', 'officers',
  'public_personal_data_purpose', 'public_personal_data_use',
  'pta_personal_data', 'teachers_service','public_cash_custody',
  'social_education','consumer_contract','child_treatment','pta_school_spending',
  'civil_remedies','public_audit'
]);
const MINIMUM = Object.freeze({
  task_authority:'学校がPTA固有事務を担当するなら、具体的な法令上の所掌・権限と例外を確認する。根拠がなければPTA側に事務を戻す。',
  membership_contract:'PTAが本人の加入意思・承諾・会員資格の発生日と対象年度を確認できる記録を整備する。非会員名簿は要求しない。',
  fee_claim:'PTAが会則・会費額・請求対象者・入金を会員記録と対応させる。会費の請求は成立した会員関係を前提とする。',
  officers:'役員就任は本人の意思を確認する。無回答を承諾や委任として処理せず、辞退の自由を示す。',
  public_personal_data_purpose:'学校の所掌事務と公法上の権限を確認した後、個人情報保護法61条の保有必要性・利用目的を特定する。',
  public_personal_data_use:'個人情報保護法69条の目的内外・例外・臨時性・本人等の権利利益を検証し、適法性が確認できない利用・提供を停止する。',
  pta_personal_data:'PTA自身が、必要最小限の会員情報について取得目的・管理・第三者提供などの取扱いを整備する。',
  teachers_service:'教職員の実従事・勤務時間・職務命令・職専免・秘密情報の使用を調べ、公務とPTA内部事務を分離する。',
  public_cash_custody:'預金契約・受領者・保管者・処分権限を確認し、自治体が他人の金銭を保管するなら法律又は政令上の例外根拠を検証する。',
  social_education:'PTAが学校行政から独立した団体として意思決定・事務・会計を行えるようにする。',
  consumer_contract:'消費者契約該当性を先に確認し、不当条項の要件を検証する。該当性未確認で違反とは扱わない。',
  child_treatment:'加入・非加入を理由に児童生徒への教育上の取扱いを不当に区別しない。',
  pta_school_spending:'PTAから学校への資金移動の実態、寄附受納、公的負担の範囲、割当的寄附の有無を確認する。',
  civil_remedies:'具体的な損害・利得・因果関係など、請求ごとの独立要件を確認する。',
  public_audit:'対象となる財務会計行為・請求人適格・請求期間など監査請求の要件を確認する。'
});
const SHORT_LAW = Object.freeze({
  task_authority:'学校教育法・地方教育行政法等',
  membership_contract:'民法521・522条',
  fee_claim:'民法521・522条等',
  officers:'民法（意思表示・委任）',
  public_personal_data_purpose:'個人情報保護法61条',
  public_personal_data_use:'個人情報保護法69・70条',
  pta_personal_data:'個人情報保護法17条以下等',
  teachers_service:'地方公務員法35・34条等',
  public_cash_custody:'地方自治法235条の4第2項等',
  social_education:'社会教育法10・12条',
  consumer_contract:'消費者契約法4・10条（適用要件要確認）',
  child_treatment:'学校教育関係法令等',
  pta_school_spending:'地方財政法4条の5等',
  civil_remedies:'民法703・709条等',
  public_audit:'地方自治法242条'
});
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
/** 青は「すべて確認して問題が見つからない」のではなく、同年度の各重要領域に一次資料の積極的な適正確認がある場合だけ。 */
export function isVerifiedCompliant(school) {
  const review=school?.complianceReview;
  if(!isObject(review)||review.outcome!=='verified_compliant'||review.schoolId!==school.schoolId
    ||!nonempty(review.targetYear)||!nonempty(review.reviewer)||!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt||'')
    ||!isObject(review.checks))return false;
  if(!['pta_direct_collection_documented','no_fee_documented'].includes(school.feeRoute))return false;
  if((school.observations||[]).some(o=>CONCERN_AXES.has(o.axis)&&TRIGGERED.has(o.status)))return false;
  return POSITIVE_CHECKS.every(k=>{
    const c=review.checks[k];
    return isObject(c)&&c.finding==='verified_compliant'
      &&c.verification==='direct_checked'&&Array.isArray(c.sourceRefs)&&c.sourceRefs.length>0
      &&c.sourceRefs.every(ref=>isObject(ref)&&nonempty(ref.sourceId)&&nonempty(ref.locator));
  });
}
export function assessParentSchool(school,legalRules=[],editorial=null){
  if(!isObject(school)||!nonempty(school.schoolId)||!Array.isArray(school.observations))
    throw new TypeError('school with schoolId and observations required');
  const hasConfirmed=school.observations.some(o=>o.status==='confirmed_yes'&&CONCERN_AXES.has(o.axis));
  const hasIndication=school.observations.some(o=>TRIGGERED.has(o.status));
  const editorialWithSource=editorial&&['urgent','review'].includes(editorial.level)&&nonempty(editorial.doc)&&nonempty(editorial.source)&&nonempty(editorial.title);
  // 公開前に原資料ポインタのある手動選定論点は「要確認」に限り格上げできる。違法認定は禁止。
  const tone=isVerifiedCompliant(school)?'verified':
    (hasConfirmed||school.feeRoute==='school_collection_documented')?'urgent':
    (hasIndication||editorialWithSource)?'review':'unknown';
  const topics=new Set((school.legalTopics||[]).filter(x=>x&&x.status==='要件検証中').map(x=>x.id));
  const rules=new Map((legalRules||[]).map(r=>[r.id,r]));
  const legal=REVIEW_ORDER.filter(id=>topics.has(id)&&rules.has(id)).map(id=>{
    const rule=rules.get(id);
    return {id,law:SHORT_LAW[id]||rule.law,fullLaw:rule.law,
      issue:rule.title,legalTest:rule.legalTest,
      lawUrl:rule.primaryLawUrl,reviewStatus:'要件検証中',
      minimum:MINIMUM[id]||'確認事実・例外・反証を原資料と照合する。'};
  });
  // 「差し当たり必要」の優先順位は順序化済みの法令別争点から導出する。
  // 事実不明の学校に「違反法令」を割り当てない。
  const minimum=legal.slice(0,5).map(x=>x.minimum);
  if(!minimum.length)minimum.push('本人の加入意思、PTA会費の請求・徴収主体、学校・教職員の実際の関与を原資料で確認する。');
  return {
    version:PARENT_REPORT_POLICY_VERSION,tone,status:STATUS[tone],
    lawReviewTitle:legal.length?'抵触の有無を検討する法律':'法律の適用判断に必要な資料が不足',
    legal,minimum,
    violationEstablished:false,
    legalCaution:'ここに掲げる法律は「違反が確定した法律」ではありません。個々の成立要件、具体的な権限、反証・例外について要件検証中です。',
    reviewOrder:'学校・PTAの主体分離 → 事務帰属 → 学校側の所掌・公法上の権限 → 個人情報保護法61条 → 69条 → 服務・資金保管・私法上の請求',
    evidenceCaution:'開示資料中にない書類は、学校やPTAに不存在と断定しない。'
  };
}
