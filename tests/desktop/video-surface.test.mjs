import test from 'node:test';import assert from 'node:assert/strict';import{EventEmitter}from'node:events';import{createRequire}from'node:module';
const {createVideoSurface}=createRequire(import.meta.url)('../../desktop/video-surface.cjs');
test('embedded surface uses only the app-owned HWND, clamps bounds and follows minimize/resize/close',()=>{
 let child;class Window extends EventEmitter{constructor(options){super();this.options=options;this.dead=false;this.visible=false;this.webContents={setWindowOpenHandler(){},on(){}};child=this;}setIgnoreMouseEvents(value){this.ignore=value;}getNativeWindowHandle(){const handle=Buffer.alloc(8);handle.writeBigUInt64LE(1234567890123n);return handle;}setBounds(value){this.bounds=value;}setShape(value){this.shape=value;}showInactive(){this.visible=true;}isVisible(){return this.visible;}hide(){this.visible=false;}isDestroyed(){return this.dead;}destroy(){this.dead=true;}}
 const parent=new EventEmitter();Object.assign(parent,{isDestroyed:()=>false,isMinimized:()=>false,isVisible:()=>true,getContentBounds:()=>({x:10,y:20,width:1000,height:600})});
 const surface=createVideoSurface({NativeWindow:Window,parent,platform:'win32'});surface.update({x:20,y:10,width:4000,height:4000});assert.equal(surface.handle(),'1234567890123');assert.equal(child.options.parent,parent);assert.equal(child.options.frame,false);assert.equal(child.options.focusable,false);assert.equal(child.ignore,true);assert.deepEqual(child.bounds,{x:30,y:30,width:980,height:590});
 surface.update({x:20,y:10,width:980,height:590,clipHeight:400});assert.deepEqual(child.shape,[{x:0,y:0,width:980,height:400}]);assert.equal(child.bounds.height,590);parent.emit('minimize');assert.equal(child.visible,false);parent.emit('restore');assert.equal(child.visible,true);surface.update({x:0,y:0,width:500,height:300,hidden:true});assert.equal(child.visible,false);assert.throws(()=>surface.update({x:NaN,y:0,width:300,height:300}));parent.emit('closed');assert.equal(child.dead,true);
});

test('next-episode occlusion preserves video beside and below the button',()=>{
 const {visibleVideoRegions}=createRequire(import.meta.url)('../../desktop/video-surface.cjs');const hole={x:800,y:450,width:180,height:50},regions=visibleVideoRegions(1000,600,[hole]);
 assert.equal(regions.reduce((a,r)=>a+r.width*r.height,0),600000-9000);
 const visible=(x,y)=>regions.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height);
 assert.equal(visible(100,470),true);assert.equal(visible(900,550),true);assert.equal(visible(850,470),false);
 assert.deepEqual(visibleVideoRegions(100,60,[{x:200,y:200,width:10,height:10}]),[{x:0,y:0,width:100,height:60}]);
 assert.deepEqual(visibleVideoRegions(100,60,[{x:0,y:0,width:100,height:60}]),[]);
});
