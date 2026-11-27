'use strict';
// A frameless, non-focusable child surface belongs to the app window. Only the
// main process creates its HWND; the renderer can request bounded layout only.
function visibleVideoRegions(width,height,occlusions=[]){
 let regions=[{x:0,y:0,width,height}];
 for(const hole of occlusions){const next=[];for(const r of regions){const left=Math.max(r.x,Math.floor(hole.x)),top=Math.max(r.y,Math.floor(hole.y)),right=Math.min(r.x+r.width,Math.ceil(hole.x+hole.width)),bottom=Math.min(r.y+r.height,Math.ceil(hole.y+hole.height));if(right<=left||bottom<=top){next.push(r);continue;}if(top>r.y)next.push({x:r.x,y:r.y,width:r.width,height:top-r.y});if(bottom<r.y+r.height)next.push({x:r.x,y:bottom,width:r.width,height:r.y+r.height-bottom});if(left>r.x)next.push({x:r.x,y:top,width:left-r.x,height:bottom-top});if(right<r.x+r.width)next.push({x:right,y:top,width:r.x+r.width-right,height:bottom-top});}regions=next;}
 return regions;
}
function createVideoSurface({NativeWindow,parent,platform=process.platform,ignoreMouseEvents=true}){
 let surface=null,layout=null;
 function sync(){
  if(!surface||surface.isDestroyed()||!layout||parent.isDestroyed())return;
  const bounds=parent.getContentBounds(),x=Math.max(0,Math.round(layout.x)),y=Math.max(0,Math.round(layout.y));
  const width=Math.max(0,Math.min(Math.round(layout.width),bounds.width-x)),height=Math.max(0,Math.min(Math.round(layout.height),bounds.height-y));
  if(parent.isMinimized()||!parent.isVisible()||width<2||height<2||layout.clipHeight===0||layout.hidden){surface.hide();return;}
  surface.setBounds({x:bounds.x+x,y:bounds.y+y,width,height});const regions=visibleVideoRegions(width,Math.min(height,Math.max(1,Math.round(layout.clipHeight??height))),layout.occlusions);if(!regions.length){surface.hide();return;}surface.setShape(regions);if(!surface.isVisible())surface.showInactive();
 }
 function close(){if(surface&&!surface.isDestroyed())surface.destroy();surface=null;if(!parent.isDestroyed())parent.webContents?.setBackgroundThrottling?.(true);}
 function handle(){
  if(platform!=='win32')return null;
  close();surface=new NativeWindow({parent,frame:false,thickFrame:false,hasShadow:false,show:false,skipTaskbar:true,focusable:false,resizable:false,movable:false,backgroundColor:'#000000'});
  parent.webContents?.setBackgroundThrottling?.(false);
  surface.setBackgroundColor?.('#000000');
  if(ignoreMouseEvents)surface.setIgnoreMouseEvents(true,{forward:true});
  const hwnd=surface.getNativeWindowHandle();sync();
  return (hwnd.length===8?hwnd.readBigUInt64LE():BigInt(hwnd.readUInt32LE())).toString();
 }
 function update(value){
  if(!value||!['x','y','width','height'].every(key=>Number.isFinite(value[key])&&Math.abs(value[key])<32768))throw Error('Área de vídeo inválida');
  if(value.clipHeight!==undefined&&(!Number.isFinite(value.clipHeight)||value.clipHeight<0||value.clipHeight>32768))throw Error('Recorte de vídeo inválido');
  const occlusions=value.occlusions??[];if(!Array.isArray(occlusions)||occlusions.length>8||occlusions.some(r=>!r||!['x','y','width','height'].every(k=>Number.isFinite(r[k])&&Math.abs(r[k])<32768)||r.width<0||r.height<0))throw Error('Superposición de vídeo inválida');
  layout={occlusions:occlusions.map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})),clipHeight:value.clipHeight,x:value.x,y:value.y,width:value.width,height:value.height,hidden:!!value.hidden};sync();
 }
 for(const event of ['move','resize','restore','show','enter-full-screen','leave-full-screen'])parent.on(event,sync);
 parent.on('minimize',()=>surface?.hide());parent.on('hide',()=>surface?.hide());parent.on('closed',close);
 return {handle,update,close,get active(){return !!surface&&!surface.isDestroyed();}};
}
module.exports={createVideoSurface,visibleVideoRegions};
