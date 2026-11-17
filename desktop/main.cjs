'use strict';
const {app,BrowserWindow,ipcMain,protocol,Menu}=require('electron');
const path=require('node:path'),fs=require('node:fs/promises');
const {createTransport}=require('./transport.cjs');
const {createResolver}=require('./dns.cjs');
const {createNativeMedia}=require('./native-media.cjs');
const {createVlcMedia}=require('./vlc-media.cjs');
const {createVideoSurface}=require('./video-surface.cjs');
const {migrateProfile}=require('./profile-migration.cjs');
app.setName('XuperWindows');if(process.platform==='win32')app.setAppUserModelId('com.matiasb.xuperwindows');if(!process.env.XUPER_QA_PROFILE)app.setPath('userData',migrateProfile(app.getPath('appData')));
protocol.registerSchemesAsPrivileged([{scheme:'xuper',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true}}]);
if(!app.requestSingleInstanceLock())app.quit();
let window,transport,nativeMedia,videoSurface;const origin='xuper://app',root=path.join(__dirname,'ui');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.wasm':'application/wasm','.woff2':'font/woff2','.ttf':'font/ttf','.mp4':'video/mp4'};
function isAppUrl(value){try{const url=new URL(value);return url.protocol==='xuper:'&&url.hostname==='app'&&!url.port&&!url.username&&!url.password;}catch(_){return false;}}
function trusted(event){if(!window||event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame||!isAppUrl(event.senderFrame.url))throw Error('Origen no autorizado');}
function open(){const resolver=createResolver();transport=createTransport({resolver});nativeMedia=createVlcMedia({getWindowHandle:()=>videoSurface.handle(),executable:path.join(app.isPackaged?path.join(process.resourcesPath,'decoder'):path.join(__dirname,'native',process.arch),'vlc.exe'),resolver,onDiagnostic:text=>{if(process.env.XUPER_QA_PROFILE)console.log('Native: '+text);},outputOptions:process.env.XUPER_QA_PROFILE?['--vout=wingdi','--aout=dummy','--avcodec-hw=none']:[],onClosed:state=>{videoSurface?.close();if(window&&!window.isDestroyed()){window.webContents.send('xw:media-closed',state);}}});window=new BrowserWindow({width:1280,height:800,minWidth:800,minHeight:600,backgroundColor:'#09090b',title:'XuperWindows 0.1.5 beta',show:false,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,backgroundThrottling:true}});videoSurface=createVideoSurface({BrowserWindow,parent:window});Menu.setApplicationMenu(null);window.once('ready-to-show',()=>window.show());window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',(event,url)=>{if(url!==origin+'/index.html')event.preventDefault();});window.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));window.webContents.session.setPermissionCheckHandler(()=>false);window.webContents.on('before-input-event',(event,input)=>{if(input.type==='keyDown'&&input.key==='F11'){event.preventDefault();window.setFullScreen(!window.isFullScreen());}});let closing=false;window.on('close',event=>{if(closing)return;event.preventDefault();closing=true;Promise.race([window.webContents.executeJavaScript('Promise.resolve(window.__xuper?.checkpointVod?.()).then(()=>window.XuperStandalone?.profileStore.flush())').catch(()=>{}),new Promise(resolve=>setTimeout(resolve,1500))]).finally(()=>{if(window&&!window.isDestroyed())window.close();});});window.on('closed',()=>{nativeMedia.close();transport.close();window=null;});window.loadURL(origin+'/index.html');}
app.whenReady().then(()=>{
 protocol.handle('xuper',async request=>{try{const url=new URL(request.url);if(url.hostname!=='app'||!['GET','HEAD'].includes(request.method))return new Response('',{status:403});const relative=decodeURIComponent(url.pathname),file=path.resolve(root,'.'+relative);if(!file.startsWith(root+path.sep))return new Response('',{status:403});const data=await fs.readFile(file);return new Response(request.method==='HEAD'?null:data,{headers:{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' https: http: data: blob:; media-src 'self' https: http: blob:; connect-src 'self' https: http:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-src 'none'",'X-Content-Type-Options':'nosniff'}});}catch(_){return new Response('',{status:404});}});
 ipcMain.handle('xw:media-open',(event,options)=>{trusted(event);return nativeMedia.open(options);});
 ipcMain.on('xw:media-layout',(event,bounds)=>{trusted(event);try{videoSurface.update(bounds);}catch(_){}});
 ipcMain.handle('xw:media-state',(event,id)=>{trusted(event);return nativeMedia.snapshot(id);});
 ipcMain.handle('xw:media-command',(event,{id,action,value})=>{trusted(event);return nativeMedia.command(id,action,value);});
 ipcMain.handle('xw:media-subtitle',(event,{id,choice})=>{trusted(event);return nativeMedia.subtitle(id,choice);});
 ipcMain.handle('xw:media-refresh',(event,{id,stream})=>{trusted(event);return nativeMedia.refresh(id,stream);});
 ipcMain.on('xw:media-stop',(event,id)=>{trusted(event);nativeMedia.close(id);});
 ipcMain.handle('xt:request',(event,{id,options})=>{trusted(event);if(!Number.isSafeInteger(id)||id<1)throw Error('ID inválido');return transport.request(id,options);});
 ipcMain.on('xt:cancel',(event,id)=>{trusted(event);transport.cancel(id);});
 ipcMain.handle('xt:diagnose',event=>{trusted(event);return transport.snapshot();});
 ipcMain.on('xt:exit',event=>{trusted(event);window.close();});
 open();app.on('activate',()=>{if(!window)open();});
});
app.on('window-all-closed',()=>app.quit());
