import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/ray/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const schools = JSON.parse(await readFile('content/schools/generated/schools.json','utf8'));
const predicates = {
  high:s=>s.schoolType==='高中', vocational:s=>s.schoolType==='高職', comprehensive:s=>s.schoolType==='綜高', continuing:s=>s.schoolType==='進修部',
  boys:s=>s.gender==='男校',girls:s=>s.gender==='女校',coed:s=>s.gender==='男女校',lodging:s=>s.lodgingStatus==='confirmed',noLodging:s=>s.lodgingStatus==='not_offered',unpublished:s=>s.lodgingStatus==='not_published',bus:s=>s.hasSchoolBus,island:s=>/金門|澎湖|連江/.test(s.city),rural:s=>/偏遠|偏鄉/.test(Object.values(s.raw).join(' ')),private:s=>s.ownership==='私立',public:s=>s.ownership==='公立',
};
const samples=Object.fromEntries(Object.entries(predicates).map(([k,p])=>[k,schools.find(p)?.code??null]));
const routes=['/','/schools','/schools/map','/schools/compare','/schools/commute','/search','/search?q=010301','/search?q=AI','/search?q=餐飲',...new Set(Object.values(samples).filter(Boolean).map(c=>`/schools/${c}`))];
const widths=[320,375,390,430,768,1440];
const browser=await chromium.launch({headless:true});
const results=[];
for(const route of routes){
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    const response=await page.goto(`http://localhost:4173${route}`,{waitUntil:'networkidle',timeout:60000});
    for(const width of widths){
      await page.setViewportSize({width,height:900});
      const check=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.title,leak:/\bundefined\b|\bnull\b/.test(document.querySelector('main')?.innerText||''),canonical:document.querySelector('link[rel=canonical]')?.getAttribute('href')}));
      results.push({route,status:response.status(),...check,overflow:check.scrollWidth>width+1,errors:[...errors]});
      if(route==='/schools' && [390,1440].includes(width)) await page.screenshot({path:`artifacts/school-rebuild/schools-${width}.png`,fullPage:true});
    }
  }catch(e){results.push({route,error:String(e)})}finally{await page.close()}
}
await browser.close();
await writeFile('artifacts/school-rebuild/browser-audit.json',JSON.stringify({samples,results},null,2));
const failures=results.filter(r=>r.error||r.status!==200||r.overflow||r.leak||r.errors.length);
console.log(JSON.stringify({samples,checks:results.length,failures},null,2));
if(failures.length)process.exitCode=1;
