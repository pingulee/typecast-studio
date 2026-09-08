import { useEffect,useRef,useState } from 'react';
import { Plus,Trash2,Copy,Check,ExternalLink,Play,Pause,Type,Download,Power } from 'lucide-react';
import { DEFAULT_CONFIG } from '../lib/config.mjs';
import { STYLES,ANIMATIONS,presetSettings } from '../lib/styles.mjs';
import { type Config,buildLayers,drawFrame,loadFont } from '../lib/render';
import { canvasBlob,downloadBlob,exportAnimation } from '../lib/export';
import { translate } from '../lib/i18n.mjs';
import Preview from './preview';
import UpdateControl from './update-control';
import { useVersionReload } from './version-reload';
export default function Studio(){
 const [config,setConfig]=useState<Config>(structuredClone(DEFAULT_CONFIG)),[loaded,setLoaded]=useState(false),[connected,setConnected]=useState(false),[status,setStatus]=useState('loading'),[error,setError]=useState(''),[paused,setPaused]=useState(false),[active,setActive]=useState(0),[copied,setCopied]=useState(false),[busy,setBusy]=useState(''),[progress,setProgress]=useState(0),[notice,setNotice]=useState(''),[opening,setOpening]=useState(false),[exited,setExited]=useState(false),[quitting,setQuitting]=useState(false);
 const pending=useRef<Config|null>(null),saving=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),exportAbort=useRef<AbortController|null>(null),latest=useRef(config);
 useVersionReload(!exited);
 const t=(key:string)=>translate(key,'zh-CN');
 useEffect(()=>{document.documentElement.lang='zh-CN';document.title='Typecast Studio';},[config.language]);
 const link=location.origin+'/overlay';
 function edit(patch:Partial<Config>){const next={...latest.current,...patch};latest.current=next;pending.current=next;setConfig(next);setStatus('editing');setError('');if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(flush,550);}
 async function flush(){if(saving.current||!pending.current)return;const snapshot=pending.current;pending.current=null;saving.current=true;setStatus('saving');try{const response=await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(snapshot),signal:AbortSignal.timeout(7000)}),data=await response.json() as {error?:string};if(!response.ok)throw new Error(data.error||t("无法保存修改。"));setStatus(pending.current?'editing':'synced');setError('');}catch(e){if(!pending.current)pending.current=snapshot;setStatus('error');setError(e instanceof Error?t(e.message):t("无法同步设置。"));}finally{saving.current=false;if(pending.current)timer.current=setTimeout(flush,2000);}}
 useEffect(()=>{if(exited)return;const source=new EventSource('/api/events');source.onmessage=e=>{try{const state=JSON.parse(e.data);setConnected(true);setLoaded(true);if(!pending.current&&!saving.current){const clean={...state.config,highlight:false,singleMode:'stay',visible:true};setConfig(clean);latest.current=clean;setStatus('synced');}}catch{setError("无法读取设置。");}};source.onerror=()=>{setConnected(false);};const guard=(e:BeforeUnloadEvent)=>{if(pending.current||saving.current){e.preventDefault();}};window.addEventListener('beforeunload',guard);return()=>{source.close();if(timer.current)clearTimeout(timer.current);window.removeEventListener('beforeunload',guard);exportAbort.current?.abort();};},[exited]);
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(id);},[notice]);
 function lineChange(index:number,value:string){const lines=[...config.lines];lines[index]=value.replace(/[\r\n]/g,' ');edit({lines});}
 async function copy(){try{await navigator.clipboard.writeText(link);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{setNotice(t("请选择下面的地址并复制。"));}}
 async function save(format:'png'|'gif'|'webp'){if(busy)return;setBusy(format);setProgress(0);const abort=new AbortController();exportAbort.current=abort;const snapshot=structuredClone(config);try{await loadFont(snapshot.font);let blob:Blob;if(format==='png'){const canvas=document.createElement('canvas');drawFrame(canvas,snapshot,buildLayers(snapshot),snapshot.transition+.1,active);blob=await canvasBlob(canvas,'image/png');}else blob=await exportAnimation(snapshot,format,setProgress,abort.signal);if(abort.signal.aborted)return;downloadBlob(blob,`typecast.${format}`);setNotice(`${format.toUpperCase()} ${t("文件已生成。")}`);}catch(e){if(e instanceof Error&&e.name!=='AbortError')setNotice(t(e.message));}finally{setBusy('');exportAbort.current=null;}}
 const validLines=config.lines.filter(s=>s.trim());
 const styles=STYLES.filter(s=>['gold','white','neon','ice','rose','jade'].includes(s.id));
 const selectedStyle=STYLES.find(s=>s.id===config.style);
 const choices=selectedStyle&&!styles.includes(selectedStyle)?[...styles,selectedStyle]:styles;
 async function openOutput(){setOpening(true);try{const r=await fetch('/api/capture-window',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),d=await r.json() as {error?:string};if(!r.ok)throw new Error(d.error||t('无法打开字幕窗口。'));setNotice('透明输出已打开。直播请使用透明链接或导出文件。');}catch(e){setNotice(e instanceof Error?t(e.message):t('无法打开字幕窗口。'));}finally{setOpening(false);}}
 async function quit(){setQuitting(true);await flush();if(pending.current||saving.current){setQuitting(false);setNotice('设置尚未保存，请稍后再试。');return;}try{const r=await fetch('/api/shutdown',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw new Error();setExited(true);setConnected(false);}catch{setNotice('无法退出，请使用托盘菜单中的 Quit。');}finally{setQuitting(false);}}
 return <div className="simple-shell">
  <header className="topbar"><div className="brand"><span className="brand-mark"><Type size={24}/></span><strong>Typecast <span>Studio</span></strong></div><button className="quit-button" onClick={quit} disabled={!loaded||quitting||exited}><Power size={15}/>{quitting?'正在退出…':'退出程序'}</button></header>
  <main>{exited?<section className="exit-screen"><Power size={32}/><h1>程序已退出</h1><p>再次使用时，请从桌面打开 Typecast Studio。</p></section>:<><div className="hero"><div><p className="eyebrow">{t('简单一点，好看一点。')}</p><h1>{t('写好文案，即刻上屏。')}</h1><p>{t('从一条开始。需要更多？点 + 就好。')}</p></div><span className={'connection '+(connected?'online':'')}><i/>{connected?t('本地已连接'):t('正在连接后台')}</span></div>
  <div className="simple-grid">
   <section className="editor-panel"><fieldset disabled={!loaded}>
    <div className="section-label"><h2>{t('直播文案')}</h2><span>{config.lines.length} / 8</span></div>
    <div className="line-list">{config.lines.map((line,i)=><div className="line-card" key={i}><div className="line-top"><label htmlFor={'line-'+i}>{String(i+1).padStart(2,'0')}</label><button className="icon-button delete-line" aria-label={`${t('删除')} ${i+1}`} disabled={config.lines.length===1} onClick={()=>edit({lines:config.lines.filter((_,j)=>j!==i)})}><Trash2 size={16}/></button></div><input id={'line-'+i} className="line-input" aria-label={`${t('直播文案')} ${i+1}`} value={line} maxLength={160} onChange={e=>lineChange(i,e.target.value)} placeholder={t('输入要在直播中显示的文字')}/></div>)}</div>
    <button className="add-line secondary" disabled={config.lines.length>=8} onClick={()=>{edit({lines:[...config.lines,'']});setTimeout(()=>document.getElementById('line-'+config.lines.length)?.focus(),0);}}><Plus size={18}/>{t('添加文案')}</button>
    <div className="section-label style-label"><h2>{t('选择样式')}</h2></div><div className="style-grid">{choices.map(({id,name,sample})=><button key={id} className={'style-tile '+id+' '+(config.style===id?'selected':'')} aria-pressed={config.style===id} onClick={()=>edit({...presetSettings(id),highlight:false})}><b>{t(sample)}</b><span>{t(name)}</span>{config.style===id&&<Check size={13}/>}</button>)}</div>
    <label className="animation-row" htmlFor="animation"><span>{t('动画效果')}</span><select id="animation" value={config.animation} onChange={e=>edit({animation:e.target.value})}>{ANIMATIONS.map(([id,name])=><option value={id} key={id}>{t(name)}</option>)}</select></label>
    <label className="animation-row" htmlFor="effect"><span>文字特效</span><select id="effect" value={config.effect} onChange={e=>edit({effect:e.target.value})}><option value="none">无特效</option><option value="fire">火焰</option><option value="wave">流光波纹</option><option value="dots">漂浮光点</option><option value="depth">动态立体</option></select></label>
   </fieldset></section>
   <section className="output-panel"><div className="preview-heading"><h2>{t('实时预览')}</h2><button className="icon-button" aria-label={paused?t('播放预览'):t('暂停预览')} onClick={()=>setPaused(!paused)}>{paused?<Play size={18}/>:<Pause size={18}/>}</button></div><div className="preview-stage"><Preview config={config} paused={paused} onLine={setActive}/>{!validLines.length&&<span className="empty-preview">{t('请先输入一条文案')}</span>}<span className="transparency-note">{t('透明背景')}</span></div><p className="preview-note">{t('一条保持显示，多条自动轮播。')}</p>
    <button className="primary output-button" disabled={!loaded||opening||!validLines.length} onClick={openOutput}><ExternalLink size={18}/>{opening?t('正在打开…'):'打开透明输出'}</button>
    <p className="output-hint">透明网页 · 支持网页源时可实时更新</p>
    <div className="url-box"><input aria-label="透明字幕链接" readOnly value={link} onFocus={e=>e.target.select()}/><button className="icon-button" aria-label="复制链接" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>}</button></div>
    <details className="connection-details"><summary>如何保持透明？</summary><p>支持网页源的直播软件：复制上方链接添加为网页源，文案会实时更新。</p><p>抖音伴侣：如不支持网页源，请使用透明 PNG / GIF / WebP 文件（动画格式以当前版本支持为准）。普通窗口捕获可能显示不透明底色，不能保证保留透明度。</p><p>输出本身始终透明，不添加绿底、黑底或棋盘格。</p></details>
    <div className="download-row"><span><Download size={15}/>{t('保存图片')}</span><div>{(['webp','gif','png'] as const).map(format=><button key={format} className="download-button" disabled={!loaded||!validLines.length||!!busy} onClick={()=>save(format)}>{format.toUpperCase()}</button>)}</div></div>
    {busy&&<div className="export-progress"><progress max={100} value={progress}/><span>{progress}%</span><button onClick={()=>exportAbort.current?.abort()}>{t('取消')}</button></div>}
   </section>
  </div><output className={'save-status '+(status==='error'?'error':'')}>{status==='error'?<><span>{t(error)}</span><button onClick={flush}>{t('重试')}</button></>:<><i/>{!connected?t('正在连接后台。请从开始菜单运行“直播花字工作室”。'):status==='synced'?t('自动保存，实时更新。'):t('正在保存并同步字幕…')}</>}</output>
  </>}</main><footer>{!exited&&<UpdateControl beforeInstall={async()=>{await flush();if(pending.current||saving.current){setNotice('设置尚未保存，请稍后再试。');return false;}return true;}}/>}{t('从任务栏托盘图标打开或退出程序。')}</footer>{notice&&<output className="toast">{notice}</output>}
 </div>;
}
