const base='http://127.0.0.1:4318';
try{const health=await fetch(base+'/api/health',{signal:AbortSignal.timeout(1200)}),state=await health.json();if(state.app!=='typecast-studio'||state.version!==2)process.exit(0);await fetch(base+'/api/shutdown',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(3000)});await new Promise(r=>setTimeout(r,500));}catch{}
