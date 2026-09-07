import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { openCaptureWindow } from './lib/capture-window.mjs';
import { createApplication } from './lib/server-core.mjs';
const base=path.dirname(fileURLToPath(import.meta.url)),PORT=4318;
const dataDir=process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,'Typecast Studio'):path.join(base,'data');
const shutdown=()=>{app.close();server.close(()=>process.exit(0));server.closeAllConnections();};
const app=await createApplication(base,PORT,{dataDir,initialLanguage:process.argv.find(x=>x.startsWith('--language='))?.slice(11),openCapture:openCaptureWindow,onShutdown:shutdown}),handle=app.handle;
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
function openEditor(){if(process.platform==='win32'&&!process.argv.includes('--no-open')){const child=spawn('rundll32.exe',['url.dll,FileProtocolHandler',`http://localhost:${PORT}`],{detached:true,stdio:'ignore'});child.on('error',()=>console.log(`Open in your browser: http://localhost:${PORT}。`));child.unref();}}
const server=http.createServer((req,res)=>handle(req,res).catch(e=>{console.error(e);if(!res.headersSent)json(res,500,{error:'Server error'});else res.destroy();}));
server.on('error',async e=>{if(e.code==='EADDRINUSE'){try{const r=await fetch(`http://127.0.0.1:${PORT}/api/health`,{signal:AbortSignal.timeout(1500)}),s=await r.json();if(s.app==='typecast-studio'&&s.version===2){openEditor();console.log('Typecast Studio is already running.');process.exit(0);}}catch{}console.error(`Port ${PORT} is in use by another app or an older version. Exit it and try again.`);}else console.error(e.message);process.exitCode=1;});
server.listen(PORT,'127.0.0.1',()=>{console.log(`\nTypecast Studio\nEditor: http://localhost:${PORT}\nTransparent output: http://localhost:${PORT}/overlay\n\nBackground service started. Open the editor from the Start menu.\n`);openEditor();});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,shutdown);
