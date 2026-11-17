'use strict';
// A frameless, non-focusable child surface belongs to the app window. Only the
// main process creates its HWND; the renderer can request bounded layout only.
function createVideoSurface({NativeWindow,parent,platform=process.platform}){
 let surface=null,layout=null;
 function sync(){
  if(!surface||surface.isDestroyed()||!layout||parent.isDestroyed())return;
  const bounds=parent.getContentBounds(),x=Math.max(0,Math.round(layout.x)),y=Math.max(0,Math.round(layout.y));
  const width=Math.max(0,Math.min(Math.round(layout.width),bounds.width-x)),height=Math.max(0,Math.min(Math.round(layout.height),bounds.height-y));
  if(parent.isMinimized()||!parent.isVisible()||width<2||height<2||layout.clipHeight===0||layout.hidden){surface.hide();return;}
  surface.setBounds({x:bounds.x+x,y:bounds.y+y,width,height});surface.setShape([{x:0,y:0,width,height:Math.min(height,Math.max(1,Math.round(layout.clipHeight??height)))}]);if(!surface.isVisible())surface.showInactive();
 }
 function close(){if(surface&&!surface.isDestroyed())surface.destroy();surface=null;}
 function handle(){
  if(platform!=='win32')return null;
  close();surface=new NativeWindow({parent,frame:false,thickFrame:false,hasShadow:false,show:false,skipTaskbar:true,focusable:false,resizable:false,movable:false,backgroundColor:'#000000'});
  surface.setIgnoreMouseEvents(true,{forward:true});
  const hwnd=surface.getNativeWindowHandle();sync();
  return (hwnd.length===8?hwnd.readBigUInt64LE():BigInt(hwnd.readUInt32LE())).toString();
 }
 function update(value){
  if(!value||!['x','y','width','height'].every(key=>Number.isFinite(value[key])&&Math.abs(value[key])<32768))throw Error('Área de vídeo inválida');
  if(value.clipHeight!==undefined&&(!Number.isFinite(value.clipHeight)||value.clipHeight<0||value.clipHeight>32768))throw Error('Recorte de vídeo inválido');
  layout={clipHeight:value.clipHeight,x:value.x,y:value.y,width:value.width,height:value.height,hidden:!!value.hidden};sync();
 }
 for(const event of ['move','resize','restore','show','enter-full-screen','leave-full-screen'])parent.on(event,sync);
 parent.on('minimize',()=>surface?.hide());parent.on('hide',()=>surface?.hide());parent.on('closed',close);
 return {handle,update,close,get active(){return !!surface&&!surface.isDestroyed();}};
}
module.exports={createVideoSurface};
