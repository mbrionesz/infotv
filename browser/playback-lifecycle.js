// One owner for background/network events. Delayed callbacks cannot revive an
// old channel, and a deliberate pause never becomes an automatic play request.
export function createPlaybackLifecycle({documentTarget=document,windowTarget=window,now=Date.now}={}){
 let current=null,suspended=null,timer=null;
 const valid=context=>context&&current===context&&context.isCurrent();
 function cancel(){clearTimeout(timer);timer=null;current=null;suspended=null;}
 function visibility(){
  const context=current;if(!valid(context)||context.failed)return;
  if(documentTarget.hidden){if(suspended)return;suspended={at:now(),play:!context.isUserPaused()};context.onEvent('lifecycle-background');context.onSuspend();}
  else if(suspended){const previous=suspended;suspended=null;context.onEvent('lifecycle-foreground');context.onResume({play:previous.play&&!context.isUserPaused(),elapsedMs:now()-previous.at});}
 }
 function offline(){const context=current;if(valid(context))context.onEvent('network-offline');}
 function online(){
  const context=current;if(!valid(context)||!context.live||documentTarget.hidden||context.isUserPaused()||timer!==null)return;
  timer=setTimeout(()=>{timer=null;if(!valid(context)||documentTarget.hidden||context.isUserPaused())return;context.onEvent('network-online-recovery');context.onOnline();},350);
 }
 documentTarget.addEventListener('visibilitychange',visibility);
 if(windowTarget.addEventListener){windowTarget.addEventListener('offline',offline);windowTarget.addEventListener('online',online);}
 return {bind(context){cancel();current=context;},cancel,dispose(){cancel();documentTarget.removeEventListener('visibilitychange',visibility);if(windowTarget.removeEventListener){windowTarget.removeEventListener('offline',offline);windowTarget.removeEventListener('online',online);}}};
}
