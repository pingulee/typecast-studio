// Runs only on the disposable GitHub Windows runner, never on the user's PC.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
if(process.env.GITHUB_ACTIONS!=='true'||process.platform!=='win32')throw new Error('Windows CI only');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 const failures=[];page.on('pageerror',e=>failures.push(e.message));
 await page.goto('http://localhost:4318');
 const picker=page.getByRole('combobox',{name:'Language / 언어 / 语言'});
 await picker.waitFor();await page.waitForFunction(()=>!document.querySelector('.language-picker select')?.disabled);
 const before=await page.locator('.line-input').first().inputValue();
 const output=await browser.newPage();await output.goto('http://localhost:4318/overlay');
 for(const [language,label,title] of [['en','Broadcast text','Text Output'],['ko','방송 문구','텍스트 출력'],['zh-CN','直播文案','字幕输出']]){
  await picker.selectOption(language);
  await page.waitForFunction(lang=>document.documentElement.lang===lang,language);
  await page.getByRole('heading',{name:label,exact:true}).waitFor();
  await page.waitForFunction(async lang=>(await(await fetch('/api/state')).json()).config.language===lang,language);
  assert.equal(await page.locator('.line-input').first().inputValue(),before);
  await output.goto('http://localhost:4318/capture?key=green');
  await output.waitForFunction(prefix=>document.title.startsWith(prefix),title);
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,language+' horizontal overflow');
  await mkdir('work/ui',{recursive:true});
  await page.screenshot({path:`work/ui/editor-${language}.png`,fullPage:true});
 }
 await page.setViewportSize({width:760,height:1100});
 await picker.selectOption('en');
 await page.waitForFunction(()=>document.documentElement.lang==='en');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'narrow English layout overflow');
 assert.deepEqual(failures,[]);
 console.log('PASS: three-language UI, saved preference, unchanged user text, localized output titles and responsive layout.');
}finally{await browser.close();}
