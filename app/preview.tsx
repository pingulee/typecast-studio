import { useEffect,useRef } from 'react';
import { buildLayers,drawFrame,loadFont,type Config } from '../lib/render';
export default function Preview({config,paused=false,restart=0,onLine}:{config:Config;paused?:boolean;restart?:number;onLine?:(i:number)=>void}){
 const ref=useRef<HTMLCanvasElement>(null),notify=useRef(onLine);useEffect(()=>{notify.current=onLine;},[onLine]);
 useEffect(()=>{let cancelled=false,frame=0,lastIndex=-1;loadFont(config.font).then(()=>{if(cancelled||!ref.current)return;const layers=buildLayers(config),start=performance.now();function tick(now:number){if(cancelled||!ref.current)return;const phase=drawFrame(ref.current,config,layers,paused?config.transition+.1:(now-start)/1000);if(phase.index!==lastIndex){lastIndex=phase.index;notify.current?.(phase.index);}frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);}).catch(()=>{if(ref.current)ref.current.setAttribute('aria-label','字体加载失败，请刷新页面。');});return()=>{cancelled=true;cancelAnimationFrame(frame);};},[config,paused,restart]);
 return <canvas ref={ref} width={config.width} height={config.height} className="text-canvas" aria-label="透明背景直播字幕预览"/>;
}
