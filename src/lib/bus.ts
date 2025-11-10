const chan = new BroadcastChannel("labpulse-storage");
export function emitStorageChanged(){ chan.postMessage({ type:"storage-changed", ts: Date.now() }); }
export function onStorageChanged(cb: ()=>void){
  const h = (e: MessageEvent)=>{ if (e.data?.type==="storage-changed") cb(); };
  chan.addEventListener("message", h);
  return () => chan.removeEventListener("message", h as any);
}

