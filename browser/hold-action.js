// A short OK activates on release; a held OK opens actions exactly once.
export function createHoldAction({delay=650,onShort,onLong}={}){
 let target=null,timer=null,long=false;
 function cancel(){clearTimeout(timer);timer=null;target=null;long=false;}
 return {start(value){if(target===value)return;cancel();target=value;timer=setTimeout(()=>{timer=null;if(!target)return;long=true;onLong(target);},delay);},release(){if(!target)return false;const value=target,held=long;cancel();if(!held)onShort(value);return true;},cancel,get active(){return !!target;}};
}
