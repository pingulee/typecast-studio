import { mkdir,readFile,writeFile,rename,rm,copyFile,readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { VERSION } from './version.mjs';
const REPO='https://github.com/pingulee/typecast-studio',API='https://api.github.com/repos/pingulee/typecast-studio/releases/latest';
const MAX_SIZE=180*1024*1024;
export function newer(next,current){
 const parse=v=>/^\d+\.\d+\.\d+$/.test(v)?v.split('.').map(Number):null,a=parse(next),b=parse(current);
 if(!a||!b)return false;for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;
}
export function releaseAsset(release,current){
 if(release.draft||release.prerelease)return null;
 const version=String(release.tag_name||'').replace(/^v/,'');if(!newer(version,current))return null;
 const name=`Typecast-Studio-Setup-${version}.exe`,asset=release.assets?.find(a=>a.name===name);
 if(!asset||asset.state!=='uploaded'||!Number.isSafeInteger(asset.size)||asset.size<1||asset.size>MAX_SIZE||!/^sha256:[a-f0-9]{64}$/.test(asset.digest||'')||asset.browser_download_url!==`${REPO}/releases/download/v${version}/${name}`)throw new Error('更新文件信息不完整，请稍后重试。');
 return {version,name,size:asset.size,digest:asset.digest.slice(7),url:asset.browser_download_url};
}
export function createUpdater({base,dataDir,version=VERSION,enabled=process.platform==='win32',fetcher=fetch,launch}={}){
 const dir=path.join(dataDir,'updates');let state={current:version,phase:enabled?'idle':'unsupported',version:null,progress:0,error:''},candidate=null,active=null,startTimer,repeatTimer,closed=false,controller;
 const snapshot=()=>({...state});
 async function check(){
  if(!enabled||closed||state.phase==='installing')return snapshot();if(active)return active;
  active=(async()=>{state={...state,phase:'checking',error:''};controller=new AbortController();
   try{
    const response=await fetcher(API,{headers:{Accept:'application/vnd.github+json','User-Agent':'Typecast-Studio/'+version},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});
    if(!response.ok)throw new Error('无法连接更新服务器，请稍后重试。');
    candidate=releaseAsset(await response.json(),version);
    if(!candidate){
     for(const name of await readdir(dir).catch(()=>[])){const match=/^Typecast-Studio-Setup-(\d+\.\d+\.\d+)\.exe$/.exec(name);if(match&&!newer(match[1],version))await rm(path.join(dir,name),{force:true}).catch(()=>{});}
     state={...state,phase:'latest',version:null};return snapshot();
    }
    await mkdir(dir,{recursive:true});const target=path.join(dir,candidate.name);
    state={...state,phase:'downloading',version:candidate.version,progress:0};
    let cached=false;try{const b=await readFile(target);cached=b.length===candidate.size&&createHash('sha256').update(b).digest('hex')===candidate.digest;}catch{}
    if(!cached){
     const response=await fetcher(candidate.url,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(180000)])});if(!response.ok||!response.body)throw new Error('更新下载失败，请稍后重试。');
     const chunks=[];let length=0;const hash=createHash('sha256');
     for await(const chunk of response.body){length+=chunk.length;if(length>candidate.size)throw new Error('更新文件大小不正确。');chunks.push(chunk);hash.update(chunk);state.progress=Math.round(length/candidate.size*100);}
     if(length!==candidate.size||hash.digest('hex')!==candidate.digest)throw new Error('更新文件校验失败，未运行安装程序。');
     const temp=target+'.tmp';await writeFile(temp,Buffer.concat(chunks));await rename(temp,target);
    }
    state={...state,phase:'ready',progress:100};
   }catch(e){if(!closed)state={...state,phase:'error',error:e.name==='TimeoutError'?'更新连接超时，请稍后重试。':(/[\u3400-\u9fff]/.test(e.message||'')?e.message:'无法连接更新服务器，请稍后重试。')};}
   finally{active=null;controller=null;}
   return snapshot();
  })();return active;
 }
 async function install(){
  if(active||state.phase!=='ready'||!candidate)throw new Error('更新尚未准备好。');
  state={...state,phase:'installing',error:''};
  try{
   const target=path.join(dir,candidate.name),bytes=await readFile(target);
   if(bytes.length!==candidate.size||createHash('sha256').update(bytes).digest('hex')!==candidate.digest)throw new Error('更新文件校验失败，请重新检查更新。');
   // Run the helper from user data, so the installer can replace Program Files.
   const helper=path.join(dir,'TypecastUpdate.exe');await copyFile(path.join(base,'TypecastUpdate.exe'),helper);
   const args=[target,base,candidate.digest];
   if(launch){await launch(helper,args);}else{
    const child=spawn(helper,args,{detached:true,stdio:'ignore',windowsHide:true});
    await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
    child.once('exit',code=>{if(!closed)state={...state,phase:'ready',error:code===0?'':'更新已取消或安装失败，当前程序仍可使用。'};});child.unref();
   }
   return snapshot();
  }catch{state={...state,phase:'error',error:'无法准备更新，请重新检查更新。'};throw new Error(state.error);}
 }
 return {snapshot,check,install,start(){if(!enabled||startTimer)return;startTimer=setTimeout(()=>void check(),10000);repeatTimer=setInterval(()=>void check(),6*60*60*1000);startTimer.unref?.();repeatTimer.unref?.();},close(){closed=true;clearTimeout(startTimer);clearInterval(repeatTimer);controller?.abort();}};
}
