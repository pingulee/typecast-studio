declare module 'gifenc' {
 export function GIFEncoder():{writeFrame:(index:Uint8Array,w:number,h:number,options:Record<string,unknown>)=>void;finish:()=>void;bytes:()=>Uint8Array};
 export function quantize(data:Uint8ClampedArray,max:number,options?:Record<string,unknown>):number[][];
 export function applyPalette(data:Uint8ClampedArray,palette:number[][],format?:string):Uint8Array;
}
