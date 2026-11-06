import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync,unlinkSync} from 'node:fs';
import path from 'node:path';import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const sdk=path.resolve(process.argv[2]||process.env.SAMSUNG_EMSDK||'');
if(!existsSync(path.join(sdk,'fastcomp/emscripten/em++')))throw new Error('Pass the Samsung Emscripten 1.39.4.7 emsdk directory');
execFileSync(path.join(sdk,'emsdk'),['activate','--embedded','latest-fastcomp'],{cwd:sdk,stdio:'inherit'});
const ports=path.join(sdk,'fastcomp/emscripten/tools/ports/tizen');
const opensslSha='b4c625fe56a4e690b57b6a011a225ad0cb3af54bd8fb67af77b5eceac55cc7191291d96a660c5b568a08a2fbf62b4612818e7cca1bb95b2b6b4fc649b0552b6d';
let upgraded=false;
for(const name of ['crypto.py','ssl.py']){
 const file=path.join(ports,name);let source=readFileSync(file,'utf8');
 if(source.includes("TAG = '1.1.1d'"))upgraded=true;
 if(!/TAG = '1\.1\.1[dw]'/.test(source))throw new Error('Unexpected Samsung OpenSSL port');
 source=source.replace(/TAG = '1\.1\.1[dw]'/,"TAG = '1.1.1w'").replace(/HASH = '[a-f0-9]+'/,'HASH = '+JSON.stringify(opensslSha));
 source=source.replace('https://www.openssl.org/source/old/1.1.1/openssl-','https://github.com/openssl/openssl/releases/download/OpenSSL_1_1_1w/openssl-').replaceAll('OpenSSL_1_1_1d','OpenSSL_1_1_1w');
 source=source.replace("['crypto', 'include', 'internal', 'bn_conf.h']","['include', 'crypto', 'bn_conf.h']").replace("['crypto', 'include', 'internal', 'dso_conf.h']","['include', 'crypto', 'dso_conf.h']");
 writeFileSync(file,source);
}
const output=path.join(root,'app/vendor/native');mkdirSync(output,{recursive:true});
const env={...process.env,EM_CONFIG:path.join(sdk,'.emscripten'),EM_CACHE:process.env.EM_CACHE||path.join(sdk,'.cache'),EM_PORTS:process.env.EM_PORTS||path.join(sdk,'.ports')};
if(upgraded)for(const name of ['libcrypto.bc','libssl.bc','libcurl.bc']){const file=path.join(env.EM_CACHE,'asmjs',name);if(existsSync(file))unlinkSync(file);}
const functions=['net_probe','net_init','net_request','net_doh','net_error','net_body','net_size','net_headers','net_report','net_metrics','malloc','free'].map(name=>'_'+name);
execFileSync(path.join(sdk,'fastcomp/emscripten/em++'),['native/transport.cpp','-std=c++14','-Os','-s','WASM=1','-s','ENVIRONMENT_MAY_BE_TIZEN=1','-s','USE_CURL=1','-s','MODULARIZE=1','-s','EXPORT_NAME=XuperNative','-s','NO_EXIT_RUNTIME=1','-s','ALLOW_MEMORY_GROWTH=1','-s','TOTAL_MEMORY=33554432','-s','EXPORTED_FUNCTIONS='+JSON.stringify(functions),'-s','EXTRA_EXPORTED_RUNTIME_METHODS=["cwrap","UTF8ToString"]','--preload-file','native/cacert.pem@/cacert.pem','-o','app/vendor/native/transport.js'],{cwd:root,env,stdio:'inherit'});
copyFileSync(path.join(sdk,'LICENSE'),path.join(output,'Emscripten-LICENSE.txt'));
copyFileSync(path.join(env.EM_PORTS,'crypto/openssl-1.1.1w/LICENSE'),path.join(output,'OpenSSL-LICENSE.txt'));
copyFileSync(path.join(env.EM_PORTS,'curl/curl-7.68.0/COPYING'),path.join(output,'curl-LICENSE.txt'));
const sources=['native/transport.cpp','native/cacert.pem','tools/build-native.mjs'];
const hash=createHash('sha256');for(const name of sources){hash.update(name+'\0');hash.update(readFileSync(path.join(root,name)));}
const assets={};for(const name of ['transport.js','transport.wasm','transport.data'])assets[name]=createHash('sha256').update(readFileSync(path.join(output,name))).digest('hex');
writeFileSync(path.join(output,'build-info.json'),JSON.stringify({sdk:'Samsung Emscripten 1.39.4.7',curl:'7.68.0',openssl:'1.1.1w',experimental:true,sourceSha256:hash.digest('hex'),assets},null,2)+'\n');
