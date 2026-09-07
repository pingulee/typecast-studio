import { createCanvas,GlobalFonts } from '@napi-rs/canvas';
import { writeFile,mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { STYLES,presetSettings,ANIMATIONS } from '../lib/styles.mjs';
import { createHash } from 'node:crypto';
import { DEFAULT_CONFIG } from '../lib/config.mjs';
await mkdir('work/qa',{recursive:true});
await build({entryPoints:['lib/export.ts'],outfile:'work/qa/export.mjs',bundle:true,platform:'node',format:'esm'});
await build({entryPoints:['lib/render.ts'],outfile:'work/qa/render.mjs',bundle:true,platform:'node',format:'esm'});
const {exportAnimation}=await import('../work/qa/export.mjs');
const {buildLayers,drawFrame}=await import('../work/qa/render.mjs');
GlobalFonts.registerFromPath('public/fonts/studio-sans.otf','StudioSans');
GlobalFonts.registerFromPath('public/fonts/studio-serif.otf','StudioSerif');
globalThis.document={fonts:{load:async()=>[]},createElement(tag){assert.equal(tag,'canvas');const c=createCanvas(1,1);c.toBlob=(callback,type)=>callback(new Blob([c.toBuffer(type)],{type}));return c;}};
const config={...DEFAULT_CONFIG};const layers=buildLayers(config),canvas=document.createElement('canvas');
for(let index=0;index<layers.length;index++){drawFrame(canvas,config,layers,config.transition+.1,index);await writeFile(`work/qa/line-${index+1}.png`,canvas.toBuffer('image/png'));}
await mkdir('docs',{recursive:true});
const sheet=createCanvas(1600,1120),sc=sheet.getContext('2d');sc.fillStyle='#141821';sc.fillRect(0,0,1600,1120);
for(const [i,style] of STYLES.entries()){const c={...config,...presetSettings(style.id),lines:['直播花字，微信：your_id']},ls=buildLayers(c);drawFrame(canvas,c,ls,c.transition+.1,0);await writeFile(`work/qa/style-${style.id}.png`,canvas.toBuffer('image/png'));const x=(i%2)*800,y=Math.floor(i/2)*160;sc.font='900 20px StudioSans';sc.fillStyle='#c6cbd5';sc.fillText(style.name,x+28,y+30);sc.drawImage(canvas,x+10,y+35,780,114);}
await writeFile('docs/designs.png',sheet.toBuffer('image/png'));
for(const [animation] of ANIMATIONS){const c={...config,animation,lines:['实时字幕，微信：your_id'],singleMode:'loop'},ls=buildLayers(c),hashes=new Set();for(const t of [.05,.2,.6,2,3.8]){drawFrame(canvas,c,ls,t);hashes.add(createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex'));}if(animation!=='cut')assert.ok(hashes.size>1,animation);}
for(const singleMode of ['stay','loop'])for(const type of ['gif','webp']){const c={...config,lines:['一条文案也能用'],singleMode};const b=await exportAnimation(c,type,()=>{},new AbortController().signal);await writeFile(`work/qa/single-${singleMode}.${type}`,new Uint8Array(await b.arrayBuffer()));}
for(const type of ['gif','webp']){let progress=0;const blob=await exportAnimation(config,type,p=>{progress=p;},new AbortController().signal);assert.equal(progress,100);await writeFile(`work/qa/export.${type}`,new Uint8Array(await blob.arrayBuffer()));}
const long={...config,lines:['很长的文案，微信：'.repeat(10)]};drawFrame(canvas,long,buildLayers(long),.8,0);const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let n=0;for(let i=3;i<data.length;i+=4)n+=data[i]>0;assert.ok(n>0);const off={...config,visible:false};drawFrame(canvas,off,layers,1);assert.equal(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4===3&&v!==0),false);
console.log('Canvas text rendering and GIF/WebP export verified without a browser or server.');
