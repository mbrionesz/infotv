import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync,spawn} from 'node:child_process';import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import path from 'node:path';import os from 'node:os';import https from 'node:https';import {once} from 'node:events';
test('native HTTP reuses its verified TLS connection and posts without an Expect handshake',async()=>{
 const temp=mkdtempSync(path.join(os.tmpdir(),'xuper-keepalive-'));let server;
 try{
 const cert=path.join(temp,'cert.pem'),key=path.join(temp,'key.pem'),source=path.join(temp,'test.cpp'),binary=path.join(temp,'test');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=xuper-keepalive.invalid','-addext','subjectAltName=DNS:xuper-keepalive.invalid','-keyout',key,'-out',cert],{stdio:'ignore'});
 writeFileSync(source,`#include ${JSON.stringify(path.resolve('native/transport.cpp'))}
int main(int argc,char** argv){if(argc!=3)return 2;net_init();std::string payload(2048,'x');for(int i=0;i<3;i++){int status=net_request(argv[1],i==2?"POST":"GET","Content-Type: text/plain",(const unsigned char*)payload.data(),i==2?payload.size():0,"xuper-keepalive.invalid",atoi(argv[2]),"127.0.0.1",2000);if(status!=200)return 3;}return 0;}`);
 const flags=execFileSync('pkg-config',['--cflags','--libs','libcurl'],{encoding:'utf8'}).trim().split(/\s+/);
 execFileSync('g++',['-std=c++14','-Wno-deprecated-declarations','-DNET_CA_FILE='+JSON.stringify(cert),source,...flags,'-o',binary]);
 let connections=0;const requests=[];
 server=https.createServer({key:readFileSync(key),cert:readFileSync(cert)},(req,res)=>{let size=0;req.on('data',chunk=>size+=chunk.length);req.on('end',()=>{requests.push({method:req.method,expect:req.headers.expect,size});res.end('ok');});});
 server.on('secureConnection',()=>connections++);server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;
 const child=spawn(binary,[`https://xuper-keepalive.invalid:${port}/`,String(port)],{env:{...process.env,NO_PROXY:'xuper-keepalive.invalid',no_proxy:'xuper-keepalive.invalid'}});const [code]=await once(child,'exit');
 assert.equal(code,0);assert.equal(connections,1);assert.equal(requests.length,3);assert.deepEqual(requests[2],{method:'POST',expect:undefined,size:2048});
 }finally{if(server){server.closeAllConnections();server.close();}rmSync(temp,{recursive:true,force:true});}
});
