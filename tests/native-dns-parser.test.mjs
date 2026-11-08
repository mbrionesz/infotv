import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import path from 'node:path';import os from 'node:os';
test('native DNS parser retains alternate A records and rejects blocked/private answers and truncated packets',()=>{
 const temp=mkdtempSync(path.join(os.tmpdir(),'xuper-dns-parser-'));
 try{
  const source=path.join(temp,'test.cpp'),binary=path.join(temp,'test');
  writeFileSync(source,`#include ${JSON.stringify(path.resolve('native/transport.cpp'))}
#include <cassert>
int main(){
 auto q=question("fixture.invalid");Reply reply;reply.bytes=q;reply.bytes[2]=129;reply.bytes[3]=128;reply.bytes[7]=3;
 for(const auto& ip:std::vector<std::vector<unsigned char>>{{0,0,0,0},{203,0,113,7},{203,0,113,8}}){reply.bytes.insert(reply.bytes.end(),{192,12,0,1,0,1,0,0,0,60,0,4});reply.bytes.insert(reply.bytes.end(),ip.begin(),ip.end());}
 std::vector<std::string> ips;unsigned ttl=600;assert(parse(reply,q,ips,ttl));assert(ips.size()==2);assert(ips[1]=="203.0.113.8");assert(ttl==60);
 reply.bytes.pop_back();assert(!parse(reply,q,ips,ttl));
 auto wrong=q;wrong[13]='x';assert(!parse(reply,wrong,ips,ttl));
 Reply empty;empty.bytes=q;empty.bytes[2]=129;empty.bytes[3]=128;assert(!parse(empty,q,ips,ttl));assert(ips.empty());
}`);
  const flags=execFileSync('pkg-config',['--cflags','--libs','libcurl'],{encoding:'utf8'}).trim().split(/\s+/);
  execFileSync('g++',['-std=c++14','-Wno-deprecated-declarations',source,...flags,'-o',binary]);execFileSync(binary,[]);
 }finally{rmSync(temp,{recursive:true,force:true});}
});

test('native IP, TLS identity and path arrays match the browser diagnostic configuration',async()=>{
 const {readFileSync}=await import('node:fs');const {resolverEndpoints}=await import('../browser/dns-diagnostic.js');const cpp=readFileSync('native/transport.cpp','utf8');
 for(const [name,field] of [['ips','ip'],['names','host'],['paths','path']]){
  const values=JSON.parse('['+cpp.match(new RegExp('const char\\* '+name+'\\[\\]\\s*=\\{([^}]+)\\}'))[1]+']');
  assert.deepEqual(values,resolverEndpoints.map(e=>e[field]));
 }
});
