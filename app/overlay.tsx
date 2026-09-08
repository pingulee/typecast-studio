import { useEffect,useState } from 'react';
import { translate } from '../lib/i18n.mjs';
import Preview from './preview';
import type { Config } from '../lib/render';
export default function Overlay(){
 const [config,setConfig]=useState<Config|null>(null),[revision,setRevision]=useState(0);
 const capture=location.pathname.startsWith('/capture');
 useEffect(()=>{const events=new EventSource('/api/events');events.onmessage=e=>{try{const s=JSON.parse(e.data);setConfig(s.config);setRevision(s.revision);}catch{}};return()=>events.close();},[capture]);
 useEffect(()=>{const language=config?.language||'en';document.documentElement.lang=language;document.title=translate(capture?'字幕输出 - Typecast Studio':'透明字幕 - Typecast Studio',language);},[capture,config?.language]);
 return <div className="overlay-surface" style={{background:'transparent'}}>{config&&<Preview config={config} restart={revision}/>}</div>;
}
