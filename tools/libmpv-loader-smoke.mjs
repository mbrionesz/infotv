import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,cpSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
if(process.platform!=='win32')throw Error('Run DLL loader validation on Windows');
const native=path.resolve('desktop/native-libmpv/x64'),folder=mkdtempSync(path.join(tmpdir(),'xuper-mpv-loader-'));
cpSync(path.join(native,'XuperMpvHost.exe'),path.join(folder,'XuperMpvHost.exe'));
async function check(expected,libraryPresent){
 const child=spawn(path.join(folder,'XuperMpvHost.exe'),[],{cwd:folder,windowsHide:true,stdio:['pipe','pipe','pipe']});let loader,buffer='';child.stdin.on('error',()=>{});
 try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Missing-dependency validation timed out')),6000);child.once('error',reject);child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{buffer+=chunk;let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);const msg=JSON.parse(line);if(msg.event==='ready')child.stdin.write(JSON.stringify({requestId:1,action:'open',url:'http://127.0.0.1:9/never-requested'})+'\n');if(msg.event==='native-loader')loader=msg;if(msg.event==='native-error'){clearTimeout(timer);try{assert.equal(msg.code,expected);assert.equal(loader.libraryPresent,libraryPresent);assert.equal(loader.vulkanPresent,false);resolve();}catch(error){reject(error);}}}});});console.log('PASS isolated loader classification '+expected+'; no system Vulkan fallback');}
 finally{await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);child.kill();});}
}
try{await check('MPV_FILE_MISSING',false);cpSync(path.join(native,'libmpv-2.dll'),path.join(folder,'libmpv-2.dll'));await check('MPV_VULKAN_FILE_MISSING',true);}finally{rmSync(folder,{recursive:true,force:true,maxRetries:5,retryDelay:250});}
