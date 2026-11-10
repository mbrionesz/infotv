import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
test('old metadata reply cannot consume a newer same-title request after recovery',()=>{
 const source=readFileSync(new URL('../app/js/app.js',import.meta.url),'utf8'),pending=[],delivered=[];
 const context=vm.createContext({un:{},vn:{},X:{},Ln:item=>item.id,kn:()=>null,renderTitleMedia(){},An(){},P:(method,payload,cb)=>pending.push(cb)});
 vm.runInContext(source.slice(source.indexOf('  function Mn(e, t) {'),source.indexOf('  function In(e) {')),context);
 context.Mn({id:'movie'},info=>delivered.push(['old',info]));context.vn={};context.un={};
 context.Mn({id:'movie'},info=>delivered.push(['new',info]));pending[0](null,{audio:'old'});
 assert.equal(delivered.length,0);assert.equal(context.un.movie,undefined);assert.equal(context.vn.movie.length,1);
 pending[1](null,{audio:'es'});assert.equal(delivered.length,1);assert.equal(delivered[0][0],'new');assert.equal(context.un.movie.audio,'es');
});
