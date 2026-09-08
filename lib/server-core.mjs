import { VERSION } from './version.mjs';
import { translate } from './i18n.mjs';
import { readFile,writeFile,mkdir,rename,stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { DEFAULT_CONFIG,validateConfig } from './config.mjs';
export async function createApplication(base,PORT=4318,options={}){
const web=path.join(base,'web'),data=options.dataDir||path.join(base,'data'),file=path.join(data,'settings.json');
let state={config:{...structuredClone(DEFAULT_CONFIG),language:'zh-CN'},revision:1},queue=Promise.resolve();const clients=new Set();
await mkdir(data,{recursive:true});
try{const saved=JSON.parse(await readFile(file,'utf8'));state.config=validateConfig(saved.config);state.revision=Number.isSafeInteger(saved.revision)?saved.revision:1;}catch(e){if(e.code!=='ENOENT'){console.error('Could not read saved settings. The original file is preserved; using defaults.');}}
const broadcast=()=>{const event=`data: ${JSON.stringify(state)}\n\n`;for(const res of clients)res.write(event);};
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value.error?{...value,error:translate(value.error,state.config.language)}:value));};
const allowedHosts=new Set([`127.0.0.1:${PORT}`,`localhost:${PORT}`]);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.otf':'font/otf','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
async function handle(req,res){
 if(!allowedHosts.has(req.headers.host)){json(res,403,{error:'仅允许本机访问。'});return;}
 const origin=req.headers.origin;if(origin&&!Array.from(allowedHosts).some(h=>origin===`http://${h}`)){json(res,403,{error:'不允许此来源。'});return;}
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{json(res,400,{error:'地址不正确。'});return;}
 if(req.method==='GET'&&pathname==='/api/state'){json(res,200,state);return;}
 if(req.method==='GET'&&pathname==='/api/health'){json(res,200,{app:'typecast-studio',version:2,release:VERSION});return;}
 if(pathname==='/api/update'&&req.method==='GET'){json(res,200,options.updater?.snapshot()||{phase:'unsupported',current:VERSION});return;}
 if(req.method==='POST'&&['/api/update/check','/api/update/install'].includes(pathname)){
  if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'请发送 JSON 数据。'});return;}
  if(!options.updater){json(res,400,{error:'此版本不支持自动更新。'});return;}
  if(pathname.endsWith('/check')){void options.updater.check();json(res,202,options.updater.snapshot());return;}
  try{await queue;json(res,200,await options.updater.install());}catch(e){json(res,400,{error:e.message});}return;
 }
 if(req.method==='GET'&&pathname==='/api/events'){
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive'});res.write(`retry: 1500\ndata: ${JSON.stringify(state)}\n\n`);clients.add(res);
  const beat=setInterval(()=>res.write(': heartbeat\n\n'),15000);req.on('close',()=>{clients.delete(res);clearInterval(beat);});return;
 }
 if(req.method==='POST'&&pathname==='/api/capture-window'){
  if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'请发送 JSON 数据。'});return;}
  try{let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1024){json(res,413,{error:'请求过大。'});return;}}const {key='transparent'}=JSON.parse(body);if(!['transparent','green','blue','black'].includes(key))throw new Error('背景颜色无效。');if(!options.openCapture)throw new Error('独立窗口功能不可用。');const result=await options.openCapture({key,width:state.config.width,height:state.config.height,dataDir:data,port:PORT});json(res,200,result);}catch(e){json(res,400,{error:e.message});}return;
 }
 if(req.method==='POST'&&pathname==='/api/shutdown'){
  if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'请发送 JSON 数据。'});return;}
  json(res,200,{ok:true});setTimeout(()=>options.onShutdown?.(),150);return;
 }
 if(req.method==='POST'&&pathname==='/api/state'){
  if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'请发送 JSON 数据。'});return;}
  try{let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>32768){json(res,413,{error:'请求过大。'});return;}}const config=validateConfig(JSON.parse(body));
   const update=queue.catch(()=>{}).then(async()=>{const next={config,revision:state.revision+1};const temp=file+'.tmp';await writeFile(temp,JSON.stringify(next,null,2),'utf8');await rename(temp,file);state=next;broadcast();return next;});queue=update;json(res,200,await update);
  }catch(e){json(res,e.code?500:400,{error:e.code?'无法保存设置，请检查用户数据目录权限和磁盘空间。':e.message});}return;
 }
 if(req.method!=='GET'&&req.method!=='HEAD'){json(res,405,{error:'不支持此请求方式。'});return;}
 if(pathname.startsWith('/api/')){json(res,404,{error:'未找到。'});return;}
 const relative=['/','/overlay','/overlay/','/capture','/capture/'].includes(pathname)?'index.html':pathname.replace(/^\/+/,''),target=path.resolve(web,relative);
 if(!target.startsWith(web+path.sep)){json(res,403,{error:'禁止访问。'});return;}
 try{const info=await stat(target);if(!info.isFile())throw new Error();res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache'});if(req.method==='HEAD'){res.end();return;}createReadStream(target).on('error',()=>res.destroy()).pipe(res);}catch{json(res,404,{error:'文件不存在。'});}
}

return {handle,close(){for(const res of clients)res.end();}};
}
