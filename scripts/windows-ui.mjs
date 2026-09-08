import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
if(process.env.GITHUB_ACTIONS!=='true'||process.platform!=='win32')throw new Error('Windows CI only');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1024,height:768}});
 const failures=[];page.on('pageerror',e=>failures.push(e.message));
 await page.goto('http://localhost:4318');
 await page.waitForFunction(()=>!document.querySelector('fieldset')?.disabled);
 assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
 assert.equal(await page.locator('.language-picker').count(),0);
 await page.getByRole('heading',{name:'直播文案',exact:true}).waitFor();
 await page.locator('.update-control').waitFor();
 assert.match(await page.locator('.update-control').innerText(),/v1\.4\.0/);
 assert.ok(['idle','checking','latest','error'].includes((await(await page.request.get('http://localhost:4318/api/update')).json()).phase));
 assert.equal(await page.locator('.line-input').count(),1);
 const sentence='欢迎来到直播间，微信：your_wechat';
 await page.locator('.line-input').first().fill(sentence);
 await page.getByRole('button',{name:'添加文案',exact:true}).click();
 assert.equal(await page.locator('.line-input').count(),2);
 await page.locator('.line-input').nth(1).fill('第二条文案，QQ：123456789');
 await page.getByRole('button',{name:'删除 2',exact:true}).click();
 assert.equal(await page.locator('.line-input').count(),1);
 assert.equal(await page.locator('.line-input').first().inputValue(),sentence);
 await page.locator('#effect').selectOption('fire');
 await page.waitForFunction(async text=>{const s=await(await fetch('/api/state')).json();return s.config.lines.length===1&&s.config.lines[0]===text&&!s.config.highlight&&s.config.effect==='fire';},sentence);
 await mkdir('work/ui',{recursive:true});
 const output=await browser.newPage();await output.goto('http://localhost:4318/capture?key=green');
 await output.waitForFunction(()=>document.title==='字幕输出 - Typecast Studio');
 await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false,'Default editor must fit one 1024x768 screen');
 assert.equal(await output.locator('.overlay-surface').evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
 for(const effect of ['fire','wave','dots','depth']){
  await page.locator('#effect').selectOption(effect);
  await page.waitForFunction(async e=>(await(await fetch('/api/state')).json()).config.effect===e,effect);
  await output.waitForTimeout(1000);
  const motion=await output.evaluate(async()=>{
   const c=document.querySelector('canvas'),ctx=c.getContext('2d'),hashes=[],gaps=[];
   let last=performance.now();
   for(let i=0;i<12;i++){
    await new Promise(r=>setTimeout(r,60));const now=performance.now();gaps.push(now-last);last=now;
    const data=ctx.getImageData(0,0,c.width,c.height).data;let h=2166136261;
    for(let p=0;p<data.length;p+=4){h=Math.imul(h^data[p],16777619);h=Math.imul(h^data[p+3],16777619);}
    hashes.push(h);
    for(const pixel of [0,c.width-1,(c.height-1)*c.width,c.width*c.height-1])if(data[pixel*4+3]!==0)throw Error('Opaque output corner');
   }
   return{distinct:new Set(hashes).size,maxGap:Math.max(...gaps)};
  });
  assert.ok(motion.distinct>=6,effect+' must keep visibly animating');
  assert.ok(motion.maxGap<500,effect+' must not block the browser');
  console.log('PASS: live '+effect+' motion '+JSON.stringify(motion));
  await output.screenshot({path:'work/ui/effect-'+effect+'.png',omitBackground:true});
 }
 await page.locator('#effect').selectOption('fire');
 await page.waitForFunction(async()=>(await(await fetch('/api/state')).json()).config.effect==='fire');
 await output.waitForTimeout(800);
 await output.screenshot({path:'work/ui/transparent-output.png',omitBackground:true});
 await mkdir('work/ui',{recursive:true});
 await page.screenshot({path:'work/ui/editor-zh-CN.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.route('**/api/update',route=>route.fulfill({json:{current:'1.4.0',phase:'ready',version:'1.4.1',progress:100}}));
 await page.getByRole('button',{name:'安装并重启',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false,'Update ready must still fit one screen');
 await page.screenshot({path:'work/ui/update-ready.png',fullPage:true});
 await page.unroute('**/api/update');
 await page.setViewportSize({width:760,height:1040});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.getByRole('button',{name:'退出程序',exact:true}).click();
 await page.getByRole('heading',{name:'程序已退出',exact:true}).waitFor();
 assert.deepEqual(failures,[]);
 console.log('PASS: Chinese-only simple UI, one entry, add/delete, uniform color, output, and web Quit.');
}finally{await browser.close();}
