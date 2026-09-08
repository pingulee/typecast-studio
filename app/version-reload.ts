import { useEffect } from 'react';
import { VERSION } from '../lib/version.mjs';
export function useVersionReload(enabled=true){
 useEffect(()=>{if(!enabled)return;let stopped=false;
  const poll=async()=>{try{const r=await fetch('/api/health',{signal:AbortSignal.timeout(3000)}),s=await r.json() as {release?:string};if(!stopped&&s.release&&s.release!==VERSION)location.reload();}catch{}};
  const timer=setInterval(poll,5000);return()=>{stopped=true;clearInterval(timer);};
 },[enabled]);
}
