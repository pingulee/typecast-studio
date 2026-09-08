import path from 'node:path';
import { access,mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
export async function openCaptureWindow({key='transparent',width=1200,height=176,dataDir,port=4318}){
 if(process.platform!=='win32')throw new Error('独立字幕窗口仅支持 Windows。');
 if(!['transparent','green','blue','black'].includes(key))throw new Error('背景颜色无效。');
 const candidates=[process.env['ProgramFiles(x86)'],process.env.ProgramFiles,process.env.LOCALAPPDATA].filter(Boolean).flatMap(p=>[path.join(p,'Microsoft/Edge/Application/msedge.exe'),path.join(p,'Google/Chrome/Application/chrome.exe')]);
 let executable;for(const candidate of candidates)try{await access(candidate);executable=candidate;break;}catch{}
 if(!executable)throw new Error('未找到 Edge 或 Chrome。请安装其中一个浏览器，或复制字幕窗口链接手动打开。');
 const profile=path.join(dataDir,'capture-profile');await mkdir(profile,{recursive:true});
 const url=`http://localhost:${port}/capture`;
 const args=[`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check',`--app=${url}`,`--window-size=${Math.min(1920,width)},${Math.max(260,height+40)}`,'--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'];
 await new Promise((resolve,reject)=>{const child=spawn(executable,args,{detached:true,stdio:'ignore'});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});
 return {url,title:'字幕输出 - Typecast Studio'};
}
