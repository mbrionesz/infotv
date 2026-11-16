'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('XuperDesktop',{platform:'windows',version:'0.1.1',request:(id,options)=>ipcRenderer.invoke('xt:request',{id,options}),cancel:id=>ipcRenderer.send('xt:cancel',id),diagnose:()=>ipcRenderer.invoke('xt:diagnose'),exit:()=>ipcRenderer.send('xt:exit')});
