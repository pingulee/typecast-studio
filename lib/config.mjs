import { STYLES,ANIMATIONS } from './styles.mjs';
export const DEFAULT_CONFIG={language:'zh-CN',effect:'none',lines:[''],style:'gold',color:'#ffd45b',outline:'#29180d',width:1200,height:176,fontSize:70,stroke:3,depth:3,glow:0,hold:3.2,transition:.4,animation:'slide',align:'center',highlight:false,visible:true,font:'sans',singleMode:'stay'};
export function validateConfig(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('设置格式不正确。');
 const out={language:'zh-CN'};if(!Array.isArray(input.lines)||input.lines.length<1||input.lines.length>8)throw new Error('支持 1 至 8 条文案，只写一条也可以。');
 out.lines=input.lines.map(s=>{if(typeof s!=='string'||s.length>160)throw new Error('每条文案最多 160 个字符。');return s.replace(/[\r\n\t]/g,' ').trim();});
 for(const [key,min,max] of [['width',640,1920],['height',96,400],['fontSize',24,140],['stroke',0,8],['depth',0,8],['glow',0,24],['hold',1,10],['transition',.15,1]]){if(typeof input[key]!=='number'||!Number.isFinite(input[key])||input[key]<min||input[key]>max)throw new Error(`参数 ${key} 超出允许范围。`);out[key]=['width','height'].includes(key)?Math.round(input[key]):input[key];}
 for(const [key,choices] of Object.entries({effect:['none','fire','wave','dots','depth'],style:STYLES.map(x=>x.id),animation:ANIMATIONS.map(x=>x[0]),align:['left','center','right'],font:['sans','serif'],singleMode:['stay','loop']})){const value=input[key]??DEFAULT_CONFIG[key];if(!choices.includes(value))throw new Error(`请检查参数 ${key}。`);out[key]=value;}
 for(const key of ['color','outline']){if(typeof input[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(input[key]))throw new Error('颜色格式不正确。');out[key]=input[key];}
 out.highlight=false;for(const key of ['visible']){if(typeof input[key]!=='boolean')throw new Error(`请检查参数 ${key}。`);out[key]=input[key];}return out;
}
export function activeLines(config){return config.lines.filter(s=>s.trim());}
export function timing(config,seconds){
 const lines=activeLines(config),span=config.hold+(config.animation==='cut'?0:2*config.transition),safe=Math.max(0,seconds),index=lines.length?Math.floor(safe/span)%lines.length:0;
 const stay=lines.length===1&&config.singleMode!=='loop',dynamic=['pulse','marquee'].includes(config.animation),t=stay&&!dynamic?safe:safe%span;
 let alpha=1,y=0,x=0,scale=1,reveal=1;
 if(config.animation!=='cut'){
  const enter=Math.min(t/config.transition,1),leave=stay?0:Math.max(0,(t-config.transition-config.hold)/config.transition);
  alpha=Math.max(0,Math.min(enter,1-leave));
  if(config.animation==='slide')y=20*((1-enter)**3-leave**3);
  if(config.animation==='slideDown')y=-20*((1-enter)**3-leave**3);
  if(config.animation==='slideLeft')x=config.width*.06*((1-enter)**3-leave**3);
  if(config.animation==='pop')scale=1-.18*(1-alpha)**2;
  if(['wipe','typewriter'].includes(config.animation)){reveal=enter;alpha=1-leave;}
  if(config.animation==='pulse'){scale=.97+.03*(.5-.5*Math.cos(2*Math.PI*t/span));if(stay)alpha=1;}
  if(config.animation==='marquee'){x=-(config.width+80)*t/span;if(stay)alpha=1;}
 }
 return{text:lines[index]||'',index,alpha,y,x,scale,reveal,span,t};
}
