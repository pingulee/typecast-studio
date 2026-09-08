import type { Config } from './render';
export type Bounds={x:number;width:number;top:number;bottom:number};
type Point={x:number;y:number;seed:number;edge:boolean};
export type EffectAssets={fire:HTMLCanvasElement;pixels:ImageData;tops:Float32Array;points:Point[];white:HTMLCanvasElement;sides:HTMLCanvasElement[];glow:HTMLCanvasElement;scale:number};
const TAU=Math.PI*2;
const lattice=new Float32Array(128*128);
let seed=71571;for(let i=0;i<lattice.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;lattice[i]=seed/4294967295;}
function noise(x:number,y:number){const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);const a=lattice[(iy&127)*128+(ix&127)],b=lattice[(iy&127)*128+((ix+1)&127)],d=lattice[((iy+1)&127)*128+(ix&127)],e=lattice[((iy+1)&127)*128+((ix+1)&127)];return(a+(b-a)*fx)*(1-fy)+(d+(e-d)*fx)*fy;}
function turbulence(x:number,y:number){return noise(x,y)*.57+noise(x*2.03+31,y*2.03)*.29+noise(x*4.07,y*4.07+17)*.14;}
function surface(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tint(layer:HTMLCanvasElement,color:string){const s=surface(layer.width,layer.height),c=s.getContext('2d')!;c.drawImage(layer,0,0);c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,s.width,s.height);return s;}
export function prepareEffect(layer:HTMLCanvasElement,b:Bounds,color:string):EffectAssets{
 const scale=2,fire=surface(Math.ceil(layer.width/scale),Math.ceil(layer.height/scale));
 const c=fire.getContext('2d')!;c.drawImage(layer,0,0,fire.width,fire.height);const alpha=c.getImageData(0,0,fire.width,fire.height).data,tops=new Float32Array(fire.width).fill(1e6),points:Point[]=[];
 for(let x=0;x<fire.width;x++)for(let y=0;y<fire.height;y++)if(alpha[(y*fire.width+x)*4+3]>160){tops[x]=y;break;}
 const full=layer.getContext('2d')!.getImageData(0,0,layer.width,layer.height).data;
 for(let y=Math.max(1,Math.floor(b.top));y<Math.min(layer.height-1,b.bottom+5);y+=3)for(let x=Math.max(1,Math.floor(b.x));x<Math.min(layer.width-1,b.x+b.width);x+=3){const p=(y*layer.width+x)*4;if(full[p+3]>200){const edge=full[p-4+3]<150||full[p+4+3]<150||full[p-layer.width*4+3]<150||full[p+layer.width*4+3]<150;points.push({x,y,edge,seed:noise(x*.27,y*.31)});}}
 const rgb=color.match(/[a-f\d]{2}/gi)?.map(x=>parseInt(x,16))||[245,190,85];
 const sides=Array.from({length:7},(_,i)=>tint(layer,`rgb(${rgb.map(v=>Math.round(v*(.16+i*.065))).join(',')})`));
 const glow=surface(40,40),g=glow.getContext('2d')!,rad=g.createRadialGradient(20,20,0,20,20,20);rad.addColorStop(0,'#ffffff');rad.addColorStop(.12,'#fff4c2');rad.addColorStop(.3,color+'b0');rad.addColorStop(1,color+'00');g.fillStyle=rad;g.fillRect(0,0,40,40);
 return{fire,pixels:c.createImageData(fire.width,fire.height),tops,points,white:tint(layer,'#ffffff'),sides,glow,scale};
}
function shimmer(c:CanvasRenderingContext2D,a:EffectAssets,b:Bounds,phase:number,strength:number){
 const w=a.white.width,h=a.white.height,ctx=a.fire.getContext('2d')!;
 // Reuse the low-resolution scratch surface; source-in keeps light inside the glyphs.
 ctx.clearRect(0,0,a.fire.width,a.fire.height);ctx.drawImage(a.white,0,0,a.fire.width,a.fire.height);ctx.globalCompositeOperation='source-in';
 const x=(b.x-100+(b.width+200)*phase)/a.scale,beam=ctx.createLinearGradient(x-38,0,x+38,h/a.scale);beam.addColorStop(0,'#ffffff00');beam.addColorStop(.45,'#ffffff00');beam.addColorStop(.5,`rgba(255,255,255,${strength})`);beam.addColorStop(.55,'#ffffff00');beam.addColorStop(1,'#ffffff00');ctx.fillStyle=beam;ctx.fillRect(0,0,a.fire.width,a.fire.height);ctx.globalCompositeOperation='source-over';c.drawImage(a.fire,0,0,w,h);
}
function drawFire(c:CanvasRenderingContext2D,layer:HTMLCanvasElement,a:EffectAssets,b:Bounds,cycle:number){
 const w=a.fire.width,h=a.fire.height,data=a.pixels.data,t=cycle*TAU,ox=Math.cos(t)*3.8,oy=Math.sin(t)*3.8;
 data.fill(0);
 for(let x=Math.max(1,Math.floor(b.x/2)-12);x<Math.min(w-1,(b.x+b.width)/2+12);x++){
  for(let y=Math.max(1,Math.floor(b.top/2)-25);y<Math.min(h-1,b.bottom/2+2);y++){
   const n=turbulence(x*.075+ox,y*.12+oy),warp=(n-.5)*16+Math.sin(y*.21+t*2)*2;
   const sx=Math.max(0,Math.min(w-1,Math.round(x+warp))),root=Math.min(a.tops[sx],a.tops[Math.max(0,sx-1)]+1,a.tops[Math.min(w-1,sx+1)]+1);
   const rise=root-y;if(rise < -2||rise>24||root>h)continue;
   const f=turbulence(x*.1+ox*1.4,y*.19+oy*1.4),height=8+18*f,fade=Math.max(0,1-rise/height);
   const density=Math.max(0,Math.min(1,(fade-(1-n)*.53)*2.6));if(!density)continue;
   const heat=Math.max(0,Math.min(1,fade*.76+density*.2)),p=(y*w+x)*4;
   data[p]=255;data[p+1]=Math.round(36+195*heat**1.7);data[p+2]=Math.round(7+132*heat**4);data[p+3]=Math.round(density*Math.min(1,(rise+3)/3)*235);
  }
 }
 a.fire.getContext('2d')!.putImageData(a.pixels,0,0);
 c.save();c.shadowColor='#ff4d12';c.shadowBlur=10;c.drawImage(a.fire,0,0,layer.width,layer.height);c.shadowBlur=0;
 // Embers detach from actual glyph columns, never from a rectangular emitter.
 for(let i=0;i<28;i++){const p=(cycle*2+i*.618)%1,x=b.x+(i*.754877%1)*b.width,col=Math.round(x/2),root=a.tops[col];if(root>h)continue;const y=root*2-p*43,drift=Math.sin(t+i)*7;const size=1.3+(i%3)*.5;c.globalAlpha=Math.sin(p*Math.PI)*.8;c.fillStyle=i%3?'#ffbc56':'#fff6d3';c.beginPath();c.ellipse(x+drift,y,size*.6,size*1.8,-.3,0,TAU);c.fill();}
 c.restore();c.drawImage(layer,0,0);shimmer(c,a,b,cycle%1,.22);
}
function drawWave(c:CanvasRenderingContext2D,layer:HTMLCanvasElement,a:EffectAssets,b:Bounds,t:number){
 // Refract the actual text, not decorative sine lines placed behind it.
 const step=3,phase=t*TAU;
 c.save();
 for(let x=Math.max(0,Math.floor(b.x)-15);x<Math.min(layer.width,b.x+b.width+15);x+=step){const u=(x-b.x)/Math.max(b.width,1),dy=Math.sin(u*TAU*1.65-phase)*5+Math.sin(u*TAU*3.3+phase*2)*1.5;c.drawImage(layer,x,0,step,layer.height,x,dy,step,layer.height);}
 c.restore();
 // A narrow, flowing caustic glints on the moving face.
 shimmer(c,a,b,t%1,.28);
}
function drawDots(c:CanvasRenderingContext2D,layer:HTMLCanvasElement,a:EffectAssets,b:Bounds,cycle:number){
 c.drawImage(layer,0,0);
 const front=(cycle%1)*(b.width+100)-50+b.x,phase=cycle*TAU;
 for(let i=0;i<a.points.length;i+=2){const p=a.points[i],distance=Math.abs(p.x-front),weight=Math.max(0,1-distance/72);if(weight<=0||p.seed<.35)continue;
  const flight=Math.sin(weight*Math.PI),dx=(p.seed-.5)*24*flight,dy=-flight*(9+20*p.seed)+Math.sin(phase*2+p.seed*30)*3;
  const size=(p.edge?6:3)+flight*5;c.save();c.globalAlpha=weight*(p.edge?.85:.38);c.drawImage(a.glow,p.x+dx-size/2,p.y+dy-size/2,size,size);c.restore();
 }
 for(let i=0;i<18;i++){const u=(cycle+i*.618)%1,x=b.x+(i*.754877%1)*b.width,y=b.top-5-Math.sin(u*Math.PI)*22,size=1.2+(i%3)*.6;c.save();c.globalAlpha=Math.sin(u*Math.PI)*.8;c.fillStyle='#fff6d0';c.fillRect(x,y,size,size);if(i%5===0){c.fillRect(x-3,y+.5,7,1);c.fillRect(x+.5,y-3,1,7);}c.restore();}
 shimmer(c,a,b,cycle%1,.32);
}
function drawDepth(c:CanvasRenderingContext2D,layer:HTMLCanvasElement,a:EffectAssets,b:Bounds,cycle:number){
 const t=cycle*TAU,cx=b.x+b.width/2,cy=(b.top+b.bottom)/2,dx=3+Math.sin(t)*7,dy=5+Math.cos(t)*2;
 c.save();c.translate(cx,cy);c.transform(.97+.025*Math.cos(t),Math.sin(t)*.012,Math.sin(t)*.09,1,0,0);c.translate(-cx,-cy);
 // Opaque, shaded sidewalls build a solid volume, rather than translucent echoes.
 for(let i=14;i>=1;i--){const index=Math.min(6,Math.floor((14-i)/2));c.drawImage(a.sides[index],dx*i/14,dy*i/14);}
 c.drawImage(a.white,-.45,-.6);c.drawImage(layer,0,0);shimmer(c,a,b,(Math.sin(t)*.5+.5),.65);c.restore();
}
export function drawEffect(c:CanvasRenderingContext2D,config:Config,layer:HTMLCanvasElement,a:EffectAssets,b:Bounds,time:number){
 const period=config.hold+(config.animation==='cut'?0:2*config.transition);
 const cycle=Math.max(0,time)/Math.max(.1,period);
 if(config.effect==='fire')drawFire(c,layer,a,b,cycle);
 else if(config.effect==='wave')drawWave(c,layer,a,b,cycle);
 else if(config.effect==='dots')drawDots(c,layer,a,b,cycle);
 else if(config.effect==='depth')drawDepth(c,layer,a,b,cycle);
 else c.drawImage(layer,0,0);
}
