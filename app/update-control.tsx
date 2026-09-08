import { useEffect,useState } from 'react';
type Update={current:string;phase:string;version?:string;progress?:number;error?:string};
export default function UpdateControl({beforeInstall}:{beforeInstall:()=>Promise<boolean>}){
 const [update,setUpdate]=useState<Update|null>(null),[busy,setBusy]=useState(false);
 useEffect(()=>{let stopped=false;const poll=async()=>{try{const r=await fetch('/api/update',{signal:AbortSignal.timeout(3000)});if(r.ok&&!stopped)setUpdate(await r.json() as Update);}catch{}};void poll();const timer=setInterval(poll,2000);return()=>{stopped=true;clearInterval(timer);};},[]);
 async function act(action:'check'|'install'){
  setBusy(true);try{if(action==='install'&&!await beforeInstall())return;
   const r=await fetch('/api/update/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),s=await r.json() as Update;
   if(!r.ok)throw new Error(s.error||'更新失败，请重试。');setUpdate(s);
  }catch(e){setUpdate(previous=>previous?{...previous,phase:'error',error:e instanceof Error?e.message:'更新失败，请重试。'}:null);}finally{setBusy(false);}
 }
 if(!update||update.phase==='unsupported')return null;
 const phase=update.phase;
 return <div className="update-control" aria-live="polite"><span>v{update.current}</span>
  {phase==='ready'?<><span>新版本 {update.version} 已就绪</span><button disabled={busy} onClick={()=>act('install')}>安装并重启</button><small>会短暂中断输出，请在下播后安装。</small></>:
   phase==='installing'?<span>正在更新，请允许 Windows 安装提示…</span>:
   phase==='downloading'?<span>后台下载更新 {update.progress}%</span>:
   phase==='checking'?<span>正在检查更新…</span>:<><span>{phase==='latest'?'已是最新版本':'自动更新已开启'}</span><button disabled={busy} onClick={()=>act('check')}>{phase==='error'?'重试更新':'检查更新'}</button></>}
  {update.error&&<small className="update-error">{update.error}</small>}
 </div>;
}
