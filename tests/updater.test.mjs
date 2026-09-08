import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,writeFile,readFile,rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createUpdater,newer,releaseAsset } from '../lib/updater.mjs';
const bytes=Buffer.from('fixture installer'),digest='sha256:'+createHash('sha256').update(bytes).digest('hex');
const release=()=>({tag_name:'v1.4.0',draft:false,prerelease:false,assets:[{name:'Typecast-Studio-Setup-1.4.0.exe',state:'uploaded',size:bytes.length,digest,browser_download_url:'https://github.com/pingulee/typecast-studio/releases/download/v1.4.0/Typecast-Studio-Setup-1.4.0.exe'}]});
test('stable versions only, no downgrade or off-repository installer',()=>{
 assert.ok(newer('1.10.0','1.9.0'));assert.ok(!newer('1.3.1','1.4.0'));assert.ok(!newer('1.4.0-beta','1.3.1'));assert.equal(releaseAsset(release(),'1.4.0'),null);
 assert.equal(releaseAsset({...release(),prerelease:true},'1.3.1'),null);
 for(const patch of [{digest:null},{size:0},{browser_download_url:'https://evil.example/setup.exe'},{name:'Other.exe'}]){const r=release();Object.assign(r.assets[0],patch);assert.throws(()=>releaseAsset(r,'1.3.1'));}
});
async function fixture(options,run){const dir=await mkdtemp(path.join(os.tmpdir(),'typecast-updater-'));await writeFile(path.join(dir,'TypecastUpdate.exe'),'helper');const updater=createUpdater({base:dir,dataDir:dir,version:'1.3.1',enabled:true,...options});try{await run(updater,dir);}finally{updater.close();await rm(dir,{recursive:true,force:true});}}
test('automatic staging verifies hash, reuses cache, and never launches until install is requested',async()=>{
 let downloads=0,launches=0;await fixture({fetcher:async url=>url.includes('api.github.com')?Response.json(release()):(downloads++,new Response(bytes)),launch:async(file,args)=>{launches++;assert.equal(args[2],digest.slice(7));assert.match(file,/TypecastUpdate.exe$/);}},async(updater)=>{
  await Promise.all([updater.check(),updater.check()]);assert.equal(updater.snapshot().phase,'ready');assert.equal(downloads,1);assert.equal(launches,0);
  await updater.check();assert.equal(downloads,1);await updater.install();assert.equal(launches,1);await assert.rejects(updater.install());
 });
});
test('corrupt download and post-download tampering cannot execute',async()=>{
 let launches=0;await fixture({fetcher:async url=>url.includes('api.github.com')?Response.json(release()):new Response(Buffer.alloc(bytes.length)),launch:async()=>launches++},async updater=>{await updater.check();assert.equal(updater.snapshot().phase,'error');await assert.rejects(updater.install());});
 await fixture({fetcher:async url=>url.includes('api.github.com')?Response.json(release()):new Response(bytes),launch:async()=>launches++},async(updater,dir)=>{await updater.check();await writeFile(path.join(dir,'updates/Typecast-Studio-Setup-1.4.0.exe'),'tampered');await assert.rejects(updater.install());});assert.equal(launches,0);
});
test('offline check is recoverable and preserves settings',async()=>{
 let online=false;await fixture({fetcher:async()=>{if(!online)throw new Error('offline');return Response.json({...release(),tag_name:'v1.3.1'});}},async(updater,dir)=>{await writeFile(path.join(dir,'settings.json'),'saved text');await updater.check();assert.equal(updater.snapshot().phase,'error');online=true;await updater.check();assert.equal(updater.snapshot().phase,'latest');assert.equal(await readFile(path.join(dir,'settings.json'),'utf8'),'saved text');});
});
