import type { Config } from './render';
export type Bounds={x:number;width:number;top:number;bottom:number};
// Deterministic, local effects. Nothing fills or clears the transparent backdrop.
export function drawBehind(c:CanvasRenderingContext2D,config:Config,b:Bounds,time:number,color:string){
 const t=Math.max(0,time),h=b.bottom-b.top;
 c.save();
 if(config.effect==='fire'){
  c.shadowColor='#ff7327';c.shadowBlur=8;
  const count=Math.min(56,Math.max(12,Math.ceil(b.width/20)));
  for(let i=0;i<count;i++){
   const phase=t*3.6+i*2.37,x=b.x+(i+.5)*b.width/count,base=b.bottom+5;
   const tall=h*.6+18+12*Math.sin(phase),tip=b.top-8-10*Math.sin(phase*.8);
   const sway=7*Math.sin(phase+1),half=7+3*Math.sin(i*4.1);
   const g=c.createLinearGradient(0,base,0,tip);g.addColorStop(0,'#ff421000');g.addColorStop(.3,'#ff5711bb');g.addColorStop(.75,'#ffa632cc');g.addColorStop(1,'#fff4ac00');
   c.fillStyle=g;c.beginPath();c.moveTo(x-half,base);c.bezierCurveTo(x-half*2,base-tall*.5,x+sway-3,tip+14,x+sway,tip);c.bezierCurveTo(x+sway+2,tip+18,x+half*2,base-tall*.25,x+half,base);c.closePath();c.fill();
  }
 }else if(config.effect==='wave'){
  c.strokeStyle=color;c.lineWidth=2;c.shadowColor=color;c.shadowBlur=7;
  for(let j=0;j<3;j++){
   c.globalAlpha=.24+j*.1;c.beginPath();
   for(let x=0;x<=b.width;x+=7){const y=(b.top+b.bottom)/2+(j-1)*(h*.55)+Math.sin(x*.035-t*2.8+j*1.7)*(7+j*2);if(x===0)c.moveTo(b.x+x,y);else c.lineTo(b.x+x,y);}
   c.stroke();
  }
 }else if(config.effect==='dots'){
  c.fillStyle=color;c.shadowColor=color;c.shadowBlur=5;
  const count=Math.min(75,Math.max(18,Math.round(b.width/12)));
  for(let i=0;i<count;i++){
   const u=(t*.22+i*.61803398875)%1,x=b.x+(i*.754877666%1)*b.width+Math.sin(t*2+i)*5;
   const y=b.bottom+13-u*(h+40),radius=1.3+(i%4)*.55;
   c.globalAlpha=Math.sin(u*Math.PI)*.85;c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();
  }
 }
 c.restore();
}
