import { GIFEncoder,quantize,applyPalette } from 'gifenc';
import { animatedWebP } from './webp.mjs';
import { buildLayers,drawFrame,loadFont,type Config } from './render';
export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export function canvasBlob(canvas:HTMLCanvasElement,type:string){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('无法生成图片。')),type,1));}
export async function exportAnimation(config:Config,type:'gif'|'webp',progress:(p:number)=>void,signal:AbortSignal){
 await loadFont(config.font);const layers=buildLayers(config);if(!layers.length)throw new Error('请先输入文案。');const canvas=document.createElement('canvas'),frames:{time:number;duration:number}[]=[],transition=config.animation==='cut'?0:config.transition,span=config.hold+2*transition;
 const stay=layers.length===1&&config.singleMode!=='loop',dynamic=['pulse','marquee'].includes(config.animation)||(config.effect&&config.effect!=='none'),once=stay&&!dynamic;
 for(let i=0;i<layers.length;i++){
  const base=i*span,steps=Math.max(1,Math.round(transition*20)),step=transition/steps;
  if(dynamic){const n=Math.round(span*20);for(let k=0;k<n;k++)frames.push({time:base+(k+.5)*span/n,duration:span/n*1000});continue;}
  if(transition)for(let n=0;n<steps;n++)frames.push({time:base+(n+.5)*step,duration:step*1000});
  frames.push({time:base+transition+.001,duration:config.hold*1000});
  if(transition&&!stay)for(let n=0;n<steps;n++)frames.push({time:base+transition+config.hold+(n+.5)*step,duration:step*1000});
 }
 const gif=type==='gif'?GIFEncoder():null,webp:{bytes:Uint8Array;duration:number}[]=[];
 for(let i=0;i<frames.length;i++){
  if(signal.aborted)throw new DOMException('已取消。','AbortError');
  const frame=frames[i];drawFrame(canvas,config,layers,frame.time+(stay&&dynamic?span:0));
  if(gif){const c=canvas.getContext('2d')!,data=c.getImageData(0,0,canvas.width,canvas.height).data;
   // A reserved palette entry prevents transparent pixels sharing an opaque color.
   for(let p=0;p<data.length;p+=4)if(data[p+3]<128){data[p]=0;data[p+1]=0;data[p+2]=0;}
   const palette=quantize(data,255,{format:'rgb565'}),indexed=applyPalette(data,palette,'rgb565'),transparentIndex=palette.length;palette.push([0,0,0]);
   for(let p=0;p<indexed.length;p++)if(data[p*4+3]<128)indexed[p]=transparentIndex;
   gif.writeFrame(indexed,canvas.width,canvas.height,{palette,transparent:true,transparentIndex,delay:frame.duration,dispose:2,repeat:once?-1:0});
  }else{const blob=await canvasBlob(canvas,'image/webp');webp.push({bytes:new Uint8Array(await blob.arrayBuffer()),duration:frame.duration});}
  progress(Math.round((i+1)/frames.length*100));await new Promise(r=>setTimeout(r,0));
 }
 if(gif){gif.finish();return new Blob([new Uint8Array(gif.bytes())],{type:'image/gif'});}
 return new Blob([animatedWebP(config.width,config.height,webp,once?1:0)],{type:'image/webp'});
}
