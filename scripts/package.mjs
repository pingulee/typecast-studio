import { mkdir,rm,cp,copyFile,readFile,writeFile,readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root=process.cwd(),stage=path.join(root,'work/installer-payload'),cache=path.join(root,'work/download'),dist=path.join(root,'dist');
await mkdir(cache,{recursive:true});await mkdir(dist,{recursive:true});
async function download(url,target){try{await readFile(target);return;}catch{}const r=await fetch(url);if(!r.ok)throw new Error(`Download failed: ${r.status} ${url}`);await writeFile(target,new Uint8Array(await r.arrayBuffer()));}
const nodeUrl='https://nodejs.org/dist/v24.19.0';
const runtime=process.env.TYPECAST_NODE_EXE||path.join(cache,'node.exe');
if(!process.env.TYPECAST_NODE_EXE)await download(nodeUrl+'/win-x64/node.exe',runtime);
await download(nodeUrl+'/SHASUMS256.txt',path.join(cache,'SHASUMS256.txt'));
const sums=await readFile(path.join(cache,'SHASUMS256.txt'),'utf8'),expected=sums.split('\n').find(l=>l.endsWith('win-x64/node.exe'))?.split(/\s+/)[0],actual=createHash('sha256').update(await readFile(runtime)).digest('hex');if(!expected||actual!==expected)throw new Error('Windows Node runtime checksum mismatch');
await download('https://raw.githubusercontent.com/nodejs/node/v24.19.0/LICENSE',path.join(cache,'NODE-LICENSE.txt'));
await rm(stage,{recursive:true,force:true});for(const dir of ['runtime','lib','licenses'])await mkdir(path.join(stage,dir),{recursive:true});
await cp(path.join(root,'web'),path.join(stage,'web'),{recursive:true});
for(const f of ['config.mjs','i18n.mjs','styles.mjs','server-core.mjs','capture-window.mjs'])await copyFile(path.join(root,'lib',f),path.join(stage,'lib',f));
for(const f of ['server.mjs','control.mjs'])await copyFile(path.join(root,f),path.join(stage,f));
await copyFile(runtime,path.join(stage,'runtime/node.exe'));await copyFile(path.join(cache,'NODE-LICENSE.txt'),path.join(stage,'licenses/NODE-LICENSE.txt'));for(const [lang,source] of [['en','README.md'],['zh-CN','docs/README.zh-CN.md']])await copyFile(path.join(root,source),path.join(stage,`User-Guide-${lang}.txt`));
const seen=new Set(),notices=[];
async function collect(name){if(seen.has(name))return;seen.add(name);const dir=path.join(root,'node_modules',name);let meta;try{meta=JSON.parse(await readFile(path.join(dir,'package.json'),'utf8'));}catch{return;}let text='';for(const f of await readdir(dir))if(/^(license|licence|copying)/i.test(f))try{text+='\n'+await readFile(path.join(dir,f),'utf8');}catch{}notices.push(`${name} ${meta.version}\nLicense: ${meta.license}\n${text}`);for(const dep of Object.keys(meta.dependencies||{}))await collect(dep);}
for(const name of ['react','react-dom','@base-ui/react','lucide-react','clsx','class-variance-authority','tailwind-merge','gifenc'])await collect(name);
await writeFile(path.join(stage,'licenses/FRONTEND-LICENSES.txt'),notices.join('\n\n'+'='.repeat(60)+'\n'));
await copyFile(path.join(root,'public/fonts/OFL.txt'),path.join(stage,'licenses/FONT-SANS-OFL.txt'));await copyFile(path.join(root,'public/fonts/OFL-Serif.txt'),path.join(stage,'licenses/FONT-SERIF-OFL.txt'));
const compiler=process.env.MAKENSIS||'makensis',flag=process.platform==='win32'?'/':'-',icon=path.join(root,'installer/app.ico');
function compile(file,defines){const args=[`${flag}V2`,...Object.entries(defines).map(([k,v])=>`${flag}D${k}=${v}`),file],r=spawnSync(compiler,args,{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw new Error(`NSIS failed: ${file}`);}
if(process.platform!=='win32')throw new Error('Build the Windows tray host on Windows (GitHub Actions).');
const csc=process.env.CSC||path.join(process.env.WINDIR||'C:/Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe');
const tray=spawnSync(csc,['/nologo','/target:winexe','/platform:anycpu','/optimize+','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll',`/win32icon:${icon}`,`/out:${path.join(stage,'TypecastStudio.exe')}`,path.join(root,'native','TrayHost.cs')],{stdio:'inherit'});
if(tray.error)throw tray.error;if(tray.status!==0)throw new Error('Tray host compilation failed');
const target=path.join(dist,'Typecast-Studio-Setup-1.3.0.exe');compile('installer/setup.nsi',{OUTPUT:target,PAYLOAD:stage,ICON:icon});
await writeFile(path.join(dist,'SHA256SUMS.txt'),createHash('sha256').update(await readFile(target)).digest('hex')+'  '+path.basename(target)+'\n');
for(const lang of ['en','zh-CN'])await copyFile(path.join(stage,`User-Guide-${lang}.txt`),path.join(dist,`User-Guide-${lang}.txt`));console.log('Installer ready:',target);
