export const STYLES = [
 {id:'gold',name:'鎏金立体',sample:'鎏金',palette:['#fff7cd','#ffe590','#ffc633','#fff3ad','#df850f'],outline:'#29180d',stroke:3,depth:3,glow:0,font:'sans',highlight:true},
 {id:'ice',name:'冰晶蓝',sample:'冰晶',palette:['#ffffff','#dbfaff','#7cc9ec','#e2fbff','#6390d1'],outline:'#15345b',stroke:2.5,depth:2,glow:2,font:'sans',highlight:true},
 {id:'neon',name:'霓虹紫',sample:'霓虹',palette:['#fff0ff','#fda9ff','#dd48ed','#ffd7ff','#a04ee2'],outline:'#65127a',stroke:2,depth:0,glow:16,font:'sans',highlight:false},
 {id:'white',name:'纯白描边',sample:'纯白',palette:['#ffffff','#ffffff','#e4e8ef','#ffffff','#aeb9ca'],outline:'#202837',stroke:3,depth:1,glow:0,font:'sans',highlight:false},
 {id:'rose',name:'玫瑰金',sample:'玫瑰',palette:['#fff4e8','#ffd5c7','#d99180','#ffecdf','#ac605f'],outline:'#532b35',stroke:2,depth:3,glow:0,font:'serif',highlight:true},
 {id:'flame',name:'烈焰橙',sample:'烈焰',palette:['#fff8a8','#ffdf47','#ff7a25','#ffc241','#d92527'],outline:'#6a1712',stroke:3,depth:4,glow:4,font:'sans',highlight:true},
 {id:'jade',name:'翡翠绿',sample:'翡翠',palette:['#f1ffe8','#aaf7c1','#22be88','#a2f0bb','#147761'],outline:'#103f35',stroke:2,depth:2,glow:0,font:'serif',highlight:true},
 {id:'chrome',name:'镜面银',sample:'镜银',palette:['#ffffff','#9eaabb','#f6fbff','#566780','#e5eeff','#65768a'],outline:'#172333',stroke:2.5,depth:4,glow:0,font:'sans',highlight:false},
 {id:'comic',name:'漫画气泡',sample:'漫画',palette:['#fff8b5','#ffe669','#ffc844'],outline:'#261838',stroke:4,depth:5,glow:0,font:'sans',highlight:false},
 {id:'cyber',name:'赛博电光',sample:'电光',palette:['#f4ffff','#80f4ff','#16c5e5','#affbff'],outline:'#642b8b',stroke:2,depth:3,glow:10,font:'sans',highlight:false},
 {id:'pearl',name:'珍珠雅宋',sample:'珍珠',palette:['#ffffff','#f4efff','#d3c7e9','#ffffff','#c1a3cc'],outline:'#51445c',stroke:1.5,depth:2,glow:0,font:'serif',highlight:true},
 {id:'candy',name:'糖果粉',sample:'糖果',palette:['#fff5fa','#ffa6cc','#ec5998','#ffd0e5'],outline:'#8b3a62',stroke:2.5,depth:3,glow:0,font:'sans',highlight:false},
 {id:'ink',name:'国风空心',sample:'国风',palette:['#ffe7ac','#dcb76b'],outline:'#ebd09b',stroke:1.5,depth:0,glow:0,font:'serif',highlight:false},
 {id:'custom',name:'自选颜色',sample:'自选',palette:['#ffd45b','#ffd45b'],outline:'#29180d',stroke:2,depth:2,glow:0,font:'sans',highlight:false},
];
export const ANIMATIONS=[['slide','向上滑入'],['slideDown','向下滑入'],['slideLeft','横向滑入'],['fade','淡入淡出'],['pop','弹性缩放'],['wipe','光幕展开'],['typewriter','逐字出现'],['pulse','轻柔呼吸'],['marquee','循环滚动'],['cut','直接显示']];
export function presetSettings(id){const s=STYLES.find(x=>x.id===id)||STYLES[0];return {style:s.id,outline:s.outline,stroke:s.stroke,depth:s.depth,glow:s.glow,font:s.font,highlight:s.highlight};}
