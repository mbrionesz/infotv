// Exit only at the section root: Back inside a player/dialog keeps navigation semantics.
export function createExitGate({now=Date.now,prompt=()=>{},exit=()=>{},windowMs=2200}={}){
 let first=null,closing=false;
 return {handle(event,atRoot){const back=[10009,461,27].includes(event.keyCode);if(!back||!atRoot){first=null;return false;}if(closing||event.repeat)return true;const time=now();if(first!==null&&time-first<=windowMs&&time-first>=0){closing=true;first=null;Promise.resolve().then(exit).finally(()=>{closing=false;});return true;}first=time;prompt();return true;},reset(){first=null;},get closing(){return closing;}};
}
