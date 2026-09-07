import { useEffect,useState } from 'react';
import Preview from './preview';
import type { Config } from '../lib/render';
export default function Overlay(){
 const [config,setConfig]=useState<Config|null>(null),[revision,setRevision]=useState(0);
 const capture=location.pathname.startsWith('/capture'),key=new URLSearchParams(location.search).get('key')||'green';
 const background=capture?({green:'#00ff00',blue:'#0000ff',black:'#000000'}[key]||'#00ff00'):'transparent';
 useEffect(()=>{document.title=capture?'字幕输出 - Typecast Studio':'透明字幕 - Typecast Studio';const events=new EventSource('/api/events');events.onmessage=e=>{try{const s=JSON.parse(e.data);setConfig(s.config);setRevision(s.revision);}catch{}};return()=>events.close();},[capture]);
 return <div className="overlay-surface" style={{background}}>{config&&<Preview config={config} restart={revision}/>}</div>;
}
