import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable,Writable } from 'node:stream';
import { mkdtemp,mkdir,writeFile,readFile,rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { DEFAULT_CONFIG,validateConfig,timing } from '../lib/config.mjs';
import { createApplication } from '../lib/server-core.mjs';
import { imageChunks,animatedWebP } from '../lib/webp.mjs';
class Response extends Writable{headers={};status=200;chunks=[];setHeader(k,v){this.headers[k]=v;}writeHead(s,h){this.status=s;Object.assign(this.headers,h);} _write(b,e,cb){this.chunks.push(Buffer.from(b));cb();}get text(){return Buffer.concat(this.chunks).toString();}}
async function request(app,url,method='GET',value,headers={}){const req=Readable.from(value===undefined?[]:[JSON.stringify(value)]);Object.assign(req,{url,method,headers:{host:'localhost:4318',...(value===undefined?{}:{'content-type':'application/json'}),...headers}});const res=new Response();await app.handle(req,res);if(!res.writableEnded)await new Promise(resolve=>res.on('finish',resolve));return res;}
test('plain text remains literal, identifiers preserved, invalid state rejected',()=>{const c=validateConfig({...DEFAULT_CONFIG,lines:['<img onerror=alert(1)>，微信：your_wechat','hello\nworld']});assert.equal(c.lines[0],'<img onerror=alert(1)>，微信：your_wechat');assert.equal(c.lines[1],'hello world');for(const patch of [{lines:[]},{lines:['x'.repeat(161)]},{width:Infinity},{color:'url(x)'},{visible:'true'},{animation:'anything'}])assert.throws(()=>validateConfig({...DEFAULT_CONFIG,...patch}));});
test('one line at a time, transition order, empty lines skipped, infinite wrap',()=>{const c={...DEFAULT_CONFIG,lines:['one','','two']},span=c.hold+2*c.transition;assert.equal(timing(c,.8).text,'one');assert.equal(timing(c,span+.8).text,'two');assert.equal(timing(c,2*span+.8).text,'one');assert.equal(timing(c,0).alpha,0);assert.equal(timing(c,.8).alpha,1);assert.equal(timing({...c,animation:'cut'},0).alpha,1);assert.equal(timing({...c,lines:['']},0).text,'');});
test('persistence, restart, write serialization, host/origin and static path protection without network listeners',async()=>{const base=await mkdtemp(path.join(os.tmpdir(),'typecast-test-'));await mkdir(path.join(base,'web'));await writeFile(path.join(base,'web/index.html'),'studio');const app=await createApplication(base);try{
 const res=await request(app,'/api/state');assert.equal(res.status,200);assert.deepEqual(JSON.parse(res.text).config,DEFAULT_CONFIG);
 const state={...DEFAULT_CONFIG,lines:['我的直播，QQ：123456789'],visible:true};const saved=await request(app,'/api/state','POST',state,{origin:'http://localhost:4318'});assert.equal(saved.status,200);assert.equal(JSON.parse(saved.text).config.visible,true);
 const restarted=await createApplication(base);assert.equal(JSON.parse((await request(restarted,'/api/state')).text).config.lines[0],state.lines[0]);restarted.close();
 const bad=await request(app,'/api/state','POST',{...state,lines:[]});assert.equal(bad.status,400);assert.deepEqual(JSON.parse(await readFile(path.join(base,'data/settings.json'),'utf8')).config,state);
 assert.equal((await request(app,'/api/state','POST',state,{origin:'https://evil.example'})).status,403);
 assert.equal((await request(app,'/api/state','GET',undefined,{host:'evil.example:4318'})).status,403);
 assert.equal((await request(app,'/%2e%2e%2flib/config.mjs')).status,403);
 assert.equal((await request(app,'/data/settings.json')).status,404);
 assert.equal((await request(app,'/overlay')).text,'studio');
 const events=new Readable({read(){}});Object.assign(events,{url:'/api/events',method:'GET',headers:{host:'localhost:4318'}});const stream=new Response();await app.handle(events,stream);assert.match(stream.text,/data: /);
 await Promise.all([request(app,'/api/state','POST',{...state,lines:['first']}),request(app,'/api/state','POST',{...state,lines:['last']})]);assert.match(stream.text,/last/);assert.equal(JSON.parse(await readFile(path.join(base,'data/settings.json'),'utf8')).config.lines[0],'last');events.emit('close');stream.end();
 }finally{app.close();await rm(base,{recursive:true,force:true});}});
test('WebP rejects non-WebP fallback instead of producing corrupt downloads',()=>{assert.throws(()=>imageChunks(new TextEncoder().encode('not a webp file')));assert.throws(()=>animatedWebP(1200,176,[]));});

test('one-line stay keeps the completed entrance visible; loop remains optional; legacy configs migrate',()=>{
 const one={...DEFAULT_CONFIG,lines:['只有一条文案']};assert.equal(timing(one,30).alpha,1);assert.equal(timing({...one,singleMode:'loop'},0).alpha,0);
 const legacy={...one};delete legacy.singleMode;delete legacy.font;const migrated=validateConfig(legacy);assert.equal(migrated.singleMode,'stay');assert.equal(migrated.font,'sans');
});
test('all selectable animations have finite transforms and multi-line ordering',()=>{
 for(const animation of ['slide','slideDown','slideLeft','fade','pop','wipe','typewriter','pulse','marquee','cut'])for(const lines of [['一条'],['一条','二条']]){
  const c={...DEFAULT_CONFIG,animation,lines};for(const t of [0,.05,.4,1,3.9,4,8,99]){const f=timing(c,t);for(const k of ['alpha','x','y','scale','reveal'])assert.ok(Number.isFinite(f[k]),animation+' '+k);assert.ok(f.alpha>=0&&f.alpha<=1);}
 }
});
test('capture-window validates input and uses user-writable data outside program directory',async()=>{
 const base=await mkdtemp(path.join(os.tmpdir(),'typecast-capture-')),user=path.join(base,'user-data'),calls=[];const app=await createApplication(base,4318,{dataDir:user,openCapture:async o=>{calls.push(o);return{url:'capture'};}});
 try{assert.equal((await request(app,'/api/capture-window','POST',{key:'blue'})).status,200);assert.equal(calls[0].key,'blue');assert.equal(calls[0].dataDir,user);assert.equal((await request(app,'/api/capture-window','POST',{key:'evil & command'})).status,400);assert.equal(calls.length,1);await request(app,'/api/state','POST',DEFAULT_CONFIG);assert.ok(await readFile(path.join(user,'settings.json')));}finally{app.close();await rm(base,{recursive:true,force:true});}
});

test('Chinese single-entry defaults migrate old languages and disable old highlighting',()=>{
 assert.equal(DEFAULT_CONFIG.language,'zh-CN');assert.deepEqual(DEFAULT_CONFIG.lines,['']);
 for(const language of ['en','ko','zh-CN']){
  const c=validateConfig({...DEFAULT_CONFIG,language,highlight:true,lines:['微信：unchanged']});
  assert.equal(c.language,'zh-CN');assert.equal(c.highlight,false);assert.deepEqual(c.lines,['微信：unchanged']);
 }
});
