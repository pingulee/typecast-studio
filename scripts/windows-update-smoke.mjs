// Exercise the production downloader, hash gate, native elevation helper and
// actual installer without publishing a fake update or starting a local fixture server.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createUpdater } from '../lib/updater.mjs';
import { VERSION } from '../lib/version.mjs';
if(process.platform!=='win32'||process.env.GITHUB_ACTIONS!=='true')throw Error('Disposable Windows CI only');
const base=path.join(process.env.ProgramFiles,'Typecast Studio'),dataDir=path.join(process.env.LOCALAPPDATA,'Typecast Studio');
const name=`Typecast-Studio-Setup-${VERSION}.exe`,bytes=await readFile(path.join('dist',name)),digest='sha256:'+createHash('sha256').update(bytes).digest('hex');
const updater=createUpdater({base,dataDir,version:'1.3.1',fetcher:async url=>url.includes('api.github.com')?Response.json({tag_name:'v'+VERSION,draft:false,prerelease:false,assets:[{name,size:bytes.length,digest,state:'uploaded',browser_download_url:`https://github.com/pingulee/typecast-studio/releases/download/v${VERSION}/${name}`}]}):new Response(bytes)});
await updater.check();assert.equal(updater.snapshot().phase,'ready');
assert.equal((await(await fetch('http://localhost:4318/api/health')).json()).app,'typecast-studio','staging must keep live service running');
await updater.install();console.log('PASS: verified update staged without stopping output; real native updater launched.');
