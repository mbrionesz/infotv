import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync,spawn} from 'node:child_process';import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import os from 'node:os';import path from 'node:path';import https from 'node:https';import {once} from 'node:events';
test('native cURL connects to forced loopback IP, retains Host/SNI and rejects certificate hostname mismatch',async()=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'xuper-native-tls-'));let server;
 try{
 const cert=path.join(root,'cert.pem'),key=path.join(root,'key.pem'),source=path.join(root,'test.cpp'),binary=path.join(root,'test');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=xuper-native.invalid','-addext','subjectAltName=DNS:xuper-native.invalid','-keyout',key,'-out',cert],{stdio:'ignore'});
 writeFileSync(source,`#include ${JSON.stringify(path.resolve('native/transport.cpp'))}\n#include <iostream>\nint main(int argc,char** argv){if(argc!=4)return 2;net_init();int result=net_request(argv[1],"GET","",nullptr,0,argv[2],atoi(argv[3]),"127.0.0.1",2000);std::cout<<result<<"\\n";if(result>0)std::cout.write((const char*)net_body(),net_size());return 0;}`);
 const flags=execFileSync('pkg-config',['--cflags','--libs','libcurl'],{encoding:'utf8'}).trim().split(/\s+/);
 execFileSync('g++',['-std=c++14','-Wno-deprecated-declarations','-DNET_CA_FILE='+JSON.stringify(cert),source,...flags,'-o',binary]);
 const seen=[];server=https.createServer({key:readFileSync(key),cert:readFileSync(cert)},(req,res)=>{seen.push({host:req.headers.host,sni:req.socket.servername});res.end('verified TLS');});server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;
 async function run(host){const child=spawn(binary,[`https://${host}:${port}/`,host,String(port)],{env:{...process.env,NO_PROXY:host,no_proxy:host}});let text='';child.stdout.on('data',chunk=>text+=chunk);await once(child,'exit');return text;}
 assert.equal(await run('xuper-native.invalid'),'200\nverified TLS');assert.equal(seen[0].host,'xuper-native.invalid:'+port);assert.equal(seen[0].sni,'xuper-native.invalid');
 assert.ok(Number((await run('wrong-native.invalid')).split('\n')[0])<0);assert.equal(seen.length,1);
 }finally{if(server){server.closeAllConnections();server.close();}rmSync(root,{recursive:true,force:true});}
});
