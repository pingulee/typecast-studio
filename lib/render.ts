import { timing } from './config.mjs';
import { STYLES } from './styles.mjs';
export type Config={lines:string[];style:string;color:string;outline:string;width:number;height:number;fontSize:number;stroke:number;depth:number;glow:number;hold:number;transition:number;animation:string;align:string;highlight:boolean;visible:boolean;font:string;singleMode:string};
type TextLayer=HTMLCanvasElement & {textBounds?:{x:number;width:number;stops:number[]}};
const fontLoads=new Map<string,Promise<void>>();
export function loadFont(font='sans'){const family=font==='serif'?'StudioSerif':'StudioSans';let promise=fontLoads.get(family);if(!promise){promise=document.fonts.load(`900 70px ${family}`).then(()=>undefined);fontLoads.set(family,promise);}return promise;}
export function makeTextLayer(config:Config,text:string):HTMLCanvasElement{
 const canvas=document.createElement('canvas') as TextLayer;canvas.width=config.width;canvas.height=config.height;const c=canvas.getContext('2d')!;
 const style=STYLES.find(s=>s.id===config.style)||STYLES[0];
 const padding=26+config.glow+config.stroke*2+config.depth;
 let size=Math.max(12,Math.min(config.fontSize,(config.height-padding*2)*.88));c.font=`900 ${size}px ${config.font==='serif'?'StudioSerif':'StudioSans'}, sans-serif`;
 const measured=c.measureText(text).width;if(measured>config.width-padding*2)size*=(config.width-padding*2)/measured;
 c.font=`900 ${size}px ${config.font==='serif'?'StudioSerif':'StudioSans'}, sans-serif`;const m=c.measureText(text),ascent=m.actualBoundingBoxAscent||size*.85,descent=m.actualBoundingBoxDescent||size*.15,baseline=(config.height+ascent-descent-config.depth)/2;
 const x=config.align==='left'?padding:config.align==='right'?config.width-padding-m.width:(config.width-m.width)/2;
 c.lineJoin='round';c.miterLimit=2;c.textBaseline='alphabetic';c.strokeStyle=config.outline;c.lineWidth=config.stroke*2+2;
 for(let d=config.depth;d>0;d--){c.strokeText(text,x+d*.35,baseline+d);c.fillStyle=config.outline;c.fillText(text,x+d*.35,baseline+d);}
 if(config.glow){c.shadowColor=config.style==='custom'?config.color:(style.palette[2]||config.color);c.shadowBlur=config.glow;}
 if(config.style==='comic'){c.lineWidth=config.stroke*2+5;c.strokeStyle='#ffffff';c.strokeText(text,x,baseline);c.strokeStyle=config.outline;}
 if(config.stroke>0){c.lineWidth=config.stroke*2;c.strokeText(text,x,baseline);}c.shadowBlur=0;
 const stops=config.style==='custom'?[config.color,config.color]:style.palette,gradient=c.createLinearGradient(0,baseline-ascent,0,baseline+descent);stops.forEach((s,i)=>gradient.addColorStop(i/(stops.length-1),s));c.fillStyle=gradient;if(config.style!=='ink')c.fillText(text,x,baseline);
 if(config.highlight){const match=text.match(/(?:[:：]\s*)([^:：]+)$/)||text.match(/(\d{5,})$/);if(match&&match.index!==undefined){const tail=match[1],prefix=text.slice(0,text.length-tail.length),g=c.createLinearGradient(0,baseline-ascent,0,baseline+descent);g.addColorStop(0,'#ffffff');g.addColorStop(.55,'#fff7e4');g.addColorStop(1,'#f2d8a4');c.fillStyle=g;c.fillText(tail,x+c.measureText(prefix).width,baseline);}}
 canvas.textBounds={x,width:m.width,stops:Array.from(text).map((_,i)=>c.measureText(Array.from(text).slice(0,i+1).join('')).width)};
 return canvas;
}
export function buildLayers(config:Config){return config.lines.filter(t=>t.trim()).map(t=>makeTextLayer(config,t));}
export function drawFrame(canvas:HTMLCanvasElement,config:Config,layers:HTMLCanvasElement[],seconds:number,forcedIndex?:number){
 if(canvas.width!==config.width)canvas.width=config.width;if(canvas.height!==config.height)canvas.height=config.height;
 const c=canvas.getContext('2d')!;c.clearRect(0,0,canvas.width,canvas.height);const phase=timing(config,seconds);if(!config.visible||!layers.length)return phase;
 const layer=layers[forcedIndex??phase.index] as TextLayer;if(!layer)return phase;
 c.save();c.globalAlpha=forcedIndex===undefined?phase.alpha:1;
 c.translate(canvas.width/2+(forcedIndex===undefined?phase.x:0),canvas.height/2+(forcedIndex===undefined?phase.y:0));const scale=forcedIndex===undefined?phase.scale:1;c.scale(scale,scale);
 if(forcedIndex===undefined&&phase.reveal<1&&layer.textBounds){const b=layer.textBounds;let width=b.width*phase.reveal;if(config.animation==='typewriter'){const count=Math.floor(b.stops.length*phase.reveal);if(!count){c.restore();return phase;}width=b.stops[count-1];}c.beginPath();c.rect(b.x-canvas.width/2-config.stroke, -canvas.height/2,width+config.stroke*2,canvas.height);c.clip();}
 c.drawImage(layer,-canvas.width/2,-canvas.height/2);
 if(config.animation==='marquee'&&forcedIndex===undefined)c.drawImage(layer,config.width+80-canvas.width/2,-canvas.height/2);
 c.restore();return phase;
}
