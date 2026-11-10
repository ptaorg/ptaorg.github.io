#!/usr/bin/env node
/** Scope legacy CSS under `.legacy` so it styles only ported page content, never the new header/footer.
 *  html/body/:root selectors become `.legacy` (body classes stay on the .legacy wrapper).
 *  Usage (needs postcss + postcss-selector-parser on NODE_PATH):
 *    node prefix-css.mjs <in.css> <out.css> [rewriteUrlsFromDir]
 *  Also usable as a module: prefixCss(text) -> text
 */
import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const postcss=require('postcss');const parser=require('postcss-selector-parser');
const SCOPE='.legacy';
const transform=parser(root=>{
  root.each(sel=>{
    const first=sel.first;
    if(!first)return;
    // find leading html/body/:root compound
    let node=sel.nodes[0];
    const isRootish=n=>n&&((n.type==='tag'&&/^(html|body)$/i.test(n.value))||(n.type==='pseudo'&&n.value===':root'));
    if(isRootish(node)){
      // html body .x  -> .legacy .x ; body.foo .x -> .legacy.foo .x
      const nodes=sel.nodes;
      for(let i=0;i<nodes.length;i++){const n=nodes[i];
        if(isRootish(n)){n.replaceWith(parser.className({value:'__SCOPE__'}));continue;}
        if(n.type==='combinator'&&isRootish(nodes[i+1]))continue;
        if(n.type==='class'||n.type==='attribute'||n.type==='pseudo'||n.type==='id')continue;
        break;}
      // collapse "__SCOPE__ __SCOPE__"
      let s=sel.toString().replace(/\.__SCOPE__(\s*[>+~]?\s*\.__SCOPE__)+/g,'.__SCOPE__');
      sel.replaceWith(parser().astSync(s).first);
      return;
    }
    sel.prepend(parser.combinator({value:' '}));
    sel.prepend(parser.className({value:'__SCOPE__'}));
  });
  // legacy <main> elements are rendered as div.legacy-main
  root.walkTags(t=>{if(t.value.toLowerCase()==='main')t.replaceWith(parser.className({value:'legacy-main'}));});
});
export function prefixCss(css){
  const root=postcss.parse(css);
  // @layer !important beats unlayered !important; unwrap so the theme layer can win
  root.walkAtRules(/^layer$/i,at=>{if(at.nodes&&at.nodes.length)at.replaceWith(at.nodes);else at.remove();});
  root.walkRules(rule=>{
    let p=rule.parent;while(p){if(p.type==='atrule'&&/keyframes$/i.test(p.name))return;p=p.parent;}
    try{rule.selector=transform.processSync(rule.selector).replace(/\.__SCOPE__/g,SCOPE);}catch{/* leave unparsable selector */}
  });
  // drop rules that would make legacy content fixed to the viewport (legacy chrome leftovers)
  return root.toString();
}
if(process.argv.length>=4&&process.argv[1]&&process.argv[1].endsWith("prefix-css.mjs")){
  const [i,o]=process.argv.slice(2);fs.writeFileSync(o,prefixCss(fs.readFileSync(i,'utf8')));
}
