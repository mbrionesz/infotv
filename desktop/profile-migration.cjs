'use strict';
const fs=require('node:fs'),path=require('node:path');
function migrateProfile(appData){const destination=path.join(appData,'XuperWindows');if(fs.existsSync(path.join(destination,'IndexedDB'))||fs.existsSync(path.join(destination,'Local Storage')))return destination;
 // Legacy folder names are read only for migration; new data always uses XuperWindows.
 const sources=['xupertizen-windows','XuperTizen'].map(name=>path.join(appData,name)).filter(file=>fs.existsSync(file)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);
 if(sources[0]){const temporary=destination+'.migration';try{fs.rmSync(temporary,{recursive:true,force:true});fs.cpSync(sources[0],temporary,{recursive:true,force:false,filter:file=>!/(?:^|[\\/])(?:Cache|Code Cache|GPUCache|DawnCache|Crashpad|SingletonLock|SingletonSocket|LOCK)(?:[\\/]|$)/.test(file)});if(fs.existsSync(destination)){fs.cpSync(temporary,destination,{recursive:true,force:false});fs.rmSync(temporary,{recursive:true,force:true});}else fs.renameSync(temporary,destination);}catch(error){throw Error('No se pudo migrar la biblioteca anterior; se conserva sin cambios.');}}
 return destination;
}
module.exports={migrateProfile};
