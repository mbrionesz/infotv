// A single cancellable timer. It never changes focus or resolves a stream.
export function createCarouselAuto({advance,canAdvance,delay=8000,setTimer=setTimeout,clearTimer=clearTimeout}){
 let timer=null,running=false;
 function schedule(){if(timer!==null)clearTimer(timer);timer=null;if(running)timer=setTimer(tick,delay);}
 function tick(){timer=null;if(!running)return;try{if(canAdvance())advance();}finally{schedule();}}
 return {start(){running=true;schedule();},interact(){if(running)schedule();},stop(){running=false;if(timer!==null)clearTimer(timer);timer=null;}};
}
