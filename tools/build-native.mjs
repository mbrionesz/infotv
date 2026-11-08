// Build maintained HTTP/TLS libraries with Samsung's socket-enabled compiler.
// No USE_CURL/USE_SSL SDK port: those recipes pin obsolete upstream releases.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import path from 'node:path';import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),args=process.argv.slice(2);
const option=(name,fallback)=>{const index=args.indexOf(name);return index<0?fallback:args[index+1];};
const sdk=path.resolve(args[0]||process.env.SAMSUNG_EMSDK||'');
const compiler=path.join(sdk,'fastcomp/emscripten');
if(!existsSync(path.join(compiler,'em++')))throw new Error('Pass the Samsung Emscripten 1.39.4.7 emsdk directory.');
const work=path.resolve(option('--work-dir',path.join(root,'.local/native-modern'))),output=path.resolve(option('--output',path.join(root,'app/vendor/native')));
const dependencies=JSON.parse(readFileSync(path.join(root,'native/dependencies.json'),'utf8'));
const prefix=path.join(work,'prefix'),jobs=String(Math.max(1,Math.min(8,Number(process.env.NATIVE_JOBS)||4)));
const env={...process.env,EM_CONFIG:process.env.EM_CONFIG||path.join(sdk,'.emscripten'),EM_CACHE:process.env.EM_CACHE||path.join(sdk,'.cache'),EM_PORTS:process.env.EM_PORTS||path.join(sdk,'.ports'),CC:path.join(compiler,'emcc'),CXX:path.join(compiler,'em++'),AR:path.join(compiler,'emar'),RANLIB:path.join(compiler,'emranlib'),CFLAGS:'-Os',curl_disallow_fcntl_o_nonblock:'yes',curl_disallow_ioctl_fionbio:'yes',curl_disallow_ioctlsocket_fionbio:'yes',curl_disallow_ioctlsocket_camel_fionbio:'yes',PKG_CONFIG_LIBDIR:path.join(prefix,'lib/pkgconfig')};
const run=(command,params,cwd)=>execFileSync(command,params,{cwd,env,stdio:'inherit'});
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
for(const folder of ['downloads','src','build'])mkdirSync(path.join(work,folder),{recursive:true});mkdirSync(prefix,{recursive:true});
for(const dep of Object.values(dependencies)){
 const archive=path.join(work,'downloads',dep.archive);if(!existsSync(archive))run('curl',['--fail','--location','--retry','2','--output',archive,dep.url],work);
 if(sha(archive)!==dep.sha256)throw new Error('Source archive checksum mismatch: '+dep.archive);
 const source=path.join(work,'src',dep.archive.replace(/\.tar\.gz$/,''));if(!existsSync(source))run('tar',['-xzf',archive,'-C',path.join(work,'src')],work);
}
function library(name,configure,build,install){
 const directory=path.join(work,'build',name);mkdirSync(directory,{recursive:true});
 const stamp=path.join(directory,'.xuper-built.json'),fingerprint=JSON.stringify({dep:dependencies[name],sdk,configure,build,install});
 if(existsSync(stamp)&&readFileSync(stamp,'utf8')===fingerprint)return;
 run(configure[0],configure.slice(1),directory);run('make',['-j'+jobs,...build],directory);run('make',install,directory);writeFileSync(stamp,fingerprint);
}
library('openssl',['perl',path.join(work,'src','openssl-'+dependencies.openssl.version,'Configure'),'linux-generic32','no-shared','no-threads','no-asm','no-dso','no-module','no-engine','no-legacy','no-tests','no-apps','no-docs','no-afalgeng','no-async','no-secure-memory','--with-rand-seed=devrandom','--prefix='+prefix,'--openssldir=/cacert','-Os'],['build_libs'],['install_dev']);
library('zlib',[path.join(work,'src','zlib-'+dependencies.zlib.version,'configure'),'--static','--prefix='+prefix],[],['install']);
const curlSource=path.join(work,'src','curl-'+dependencies.curl.version);
if(!readFileSync(path.join(curlSource,'lib/curlx/nonblock.c'),'utf8').includes('XUPER_TIZEN_NONBLOCK_SOCKETS'))run('patch',['-p1','--forward','--input',path.join(root,'native/patches/curl-nonblock-tizen.patch')],curlSource);
const disabled=['shared','threaded-resolver','ipv6','proxy','ftp','file','ldap','ldaps','rtsp','dict','telnet','tftp','pop3','imap','smtp','gopher','mqtt','websockets','ntlm','manual','docs','unix-sockets','socketpair'];
const without=['libpsl','libidn2','nghttp2','nghttp3','ngtcp2','quiche','brotli','zstd','libssh2','ca-path'];
library('curl',[path.join(work,'src','curl-'+dependencies.curl.version,'configure'),'--cache-file=config.cache','--host=wasm32-unknown-emscripten','--prefix='+prefix,'--enable-static','--with-openssl='+prefix,'--with-zlib='+prefix,'--with-ca-bundle=/cacert.pem',...disabled.map(name=>'--disable-'+name),...without.map(name=>'--without-'+name)],['-C','lib','CFLAGS=-Os -DXUPER_TIZEN_NONBLOCK_SOCKETS'],['-C','lib','install']);
mkdirSync(output,{recursive:true});
const functions=['net_probe','net_init','net_build_info','net_request','net_doh','net_error','net_body','net_size','net_headers','net_report','net_metrics','malloc','free'].map(name=>'_'+name);
run(env.CXX,[path.join(root,'native/transport.cpp'),'-std=c++14','-Os','-I'+path.join(prefix,'include'),...['curl','ssl','crypto','z'].map(name=>path.join(prefix,'lib','lib'+name+'.a')),'-s','WASM=1','-s','ENVIRONMENT_MAY_BE_TIZEN=1','-s','MODULARIZE=1','-s','EXPORT_NAME=XuperNative','-s','NO_EXIT_RUNTIME=1','-s','ALLOW_MEMORY_GROWTH=1','-s','TOTAL_MEMORY=33554432','-s','EXPORTED_FUNCTIONS='+JSON.stringify(functions),'-s','EXTRA_EXPORTED_RUNTIME_METHODS=["cwrap","UTF8ToString","FS"]','--preload-file',path.join(root,'native/cacert.pem')+'@/cacert.pem','-o',path.join(output,'transport.js')],root);
for(const [source,target] of [[path.join(sdk,'LICENSE'),'Emscripten-LICENSE.txt'],[path.join(work,'src','openssl-'+dependencies.openssl.version,'LICENSE.txt'),'OpenSSL-LICENSE.txt'],[path.join(work,'src','curl-'+dependencies.curl.version,'COPYING'),'curl-LICENSE.txt'],[path.join(work,'src','zlib-'+dependencies.zlib.version,'LICENSE'),'zlib-LICENSE.txt']])copyFileSync(source,path.join(output,target));
const sources=['native/transport.cpp','native/cacert.pem','native/dependencies.json','native/patches/curl-nonblock-tizen.patch','tools/build-native.mjs'];
const hash=createHash('sha256');for(const name of sources){hash.update(name+'\0');hash.update(readFileSync(path.join(root,name)));}
const assets={};for(const name of ['transport.js','transport.wasm','transport.data'])assets[name]=sha(path.join(output,name));
writeFileSync(path.join(output,'build-info.json'),JSON.stringify({sdk:'Samsung Emscripten 1.39.4.7',curl:dependencies.curl.version,openssl:dependencies.openssl.version,zlib:dependencies.zlib.version,experimental:true,dns:'IP-DoH-Host-SNI-TLS-verified',entropy:'Emscripten /dev/urandom backed by crypto.getRandomValues; no weak fallback',sourceSha256:hash.digest('hex'),assets},null,2)+'\n');
console.log('Maintained native transport built at '+output+'. Samsung hardware validation still required.');
