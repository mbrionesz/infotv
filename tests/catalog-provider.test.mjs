import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function fixture(reply){const calls=[];const context=vm.createContext({Buffer,Date,console,module:{exports:{}},require:name=>{if(name==='./audio-language')return require('../companion/lib/audio-language.js');
  if(name==='fs')return {readFileSync(){throw new Error('no cache')},writeFileSync(){}};if(name==='http'||name==='https')return {request(){throw new Error('No external network')}};if(name==='./dnsx'||name==='./upstream')return {};return require(name);},fixtureCall:(path,bean,cb)=>{calls.push({path,bean:JSON.parse(JSON.stringify(bean))});reply(path,bean,cb);}});vm.runInContext(readFileSync(new URL('../companion/lib/magis.js',import.meta.url),'utf8')+'\ncall=fixtureCall;ensureSession=function(cb){cb(null);};',context);return {calls,core:context.module.exports};}
const invoke=(core,method,...args)=>new Promise((resolve,reject)=>core[method](...args,(error,value)=>error?reject(error):resolve(value)));
test('full catalog sends server filters and paginates beyond editorial/home results',async()=>{
 const f=fixture((path,bean,cb)=>cb(null,{totalSize:21000,assetList:[{contentId:'hidden-'+bean.pageNum,name:'Outside home',type:'movie'}]}));
 const result=await invoke(f.core,'catalogBrowse','movies',{pageNum:2,pageSize:36,filters:{genre:'Drama',year:'2024',country:'Chile'}});
 assert.equal(result.total,21000);assert.equal(result.items[0].id,'hidden-2');assert.equal(result.hasMore,true);assert.deepEqual(f.calls[0],{path:'v3/filterByContent',bean:{columnId:76177,pageNum:2,pageSize:36,tags:'Drama',year:'2024',originalCountry:'Chile'}});
});
test('categories are sorted, restricted categories excluded, shelf pages validated against exposed categories',async()=>{
 const f=fixture((path,bean,cb)=>cb(null,path.endsWith('getColumnContents')?{childColumnList:[{id:'b',name:'Second',sequence:2},{id:'adult',restricted:'1'},{id:'a',name:'First',sequence:1}]}:{assetList:[{contentId:'s1',name:'Series',type:'teleplay'}],assetListTotalSize:37}));
 const columns=await invoke(f.core,'catalogColumns','series');assert.deepEqual(Array.from(columns.columns,c=>c.id),['a','b']);
 const result=await invoke(f.core,'catalogBrowse','series',{pageNum:2,filters:{column:'a'}});assert.equal(result.hasMore,false);assert.equal(result.total,37);assert.equal(f.calls.at(-1).path,'v3/getShelveData');assert.equal(f.calls.at(-1).bean.pageNum,2);
 await assert.rejects(invoke(f.core,'catalogBrowse','series',{filters:{column:'adult'}}),/no disponible/);assert.equal(f.calls.at(-1).path,'v3/getColumnContents');
});
test('unknown total uses raw page size, not the number left after deduplication',async()=>{
 const f=fixture((path,bean,cb)=>cb(null,{assetList:Array.from({length:36},()=>({contentId:'same',name:'Duplicate'}))}));
 const result=await invoke(f.core,'catalogBrowse','movies',{});assert.equal(result.total,null);assert.equal(result.items.length,1);assert.equal(result.hasMore,true);
 await assert.rejects(invoke(f.core,'catalogBrowse','adult',{}),/desconocida/);
});
test('server search preserves page, root scope and reported total; filter metadata is normalized',async()=>{
 const f=fixture((path,bean,cb)=>cb(null,path.endsWith('filterGenre')?{tags:['Drama',{value:'Action'}],year:['2024'],originalCountry:['Chile']}:{totalSize:90,searchItemList:[{itemList:[{contentId:'episode',name:'Result',type:'teleplay'}]}]}));
 const result=await invoke(f.core,'catalogSearchPage','series',{text:'Test',pageNum:2});assert.equal(result.total,90);assert.equal(result.hasMore,true);assert.equal(f.calls[0].bean.columnId,76178);assert.equal(f.calls[0].bean.pageNum,2);
 const facets=await invoke(f.core,'catalogFilters','series');assert.deepEqual(Array.from(facets.genres),['Drama','Action']);
});
test('an oversized provider page cannot flood the visible page with hundreds of titles',async()=>{
 const f=fixture((path,bean,cb)=>cb(null,{totalSize:1000,assetList:Array.from({length:500},(_,i)=>({contentId:String(i),name:'Title '+i}))}));const result=await invoke(f.core,'catalogBrowse','movies',{pageSize:36});assert.equal(result.items.length,36);assert.equal(result.total,1000);assert.equal(result.hasMore,true);
});
test('a category shelf failure falls back to filtering the same category, never the root',async()=>{
 const f=fixture((path,bean,cb)=>{
  if(path.endsWith('getColumnContents'))return cb(null,{childColumnList:[{id:'turkey',name:'Serie Turquía'}]});
  if(path.endsWith('getShelveData'))return cb(new Error('Shelf unsupported'));
  cb(null,{assetList:[{contentId:'turkish-series',name:'Turkish result',type:'teleplay'}],totalSize:1});
 });
 const result=await invoke(f.core,'catalogBrowse','series',{filters:{column:'turkey'}});assert.equal(result.items[0].id,'turkish-series');assert.equal(result.total,1);assert.deepEqual(f.calls.map(c=>c.path),['v3/getColumnContents','v3/getShelveData','v3/filterByContent']);assert.equal(f.calls.at(-1).bean.columnId,'turkey');assert.equal(f.calls.at(-1).bean.columnType,undefined);
});
test('all roots preserve every combination of category, genre, year, country and page',async()=>{
 const roots={featured:76176,movies:76177,series:76178,kids:76783,anime:76180};let checked=0;
 for(const [root,rootId] of Object.entries(roots))for(const column of ['', 'cat-a','cat-b'])for(let mask=0;mask<8;mask++)for(const page of [1,2]){
  const filters={column,genre:mask&1?'drama-code':'',year:mask&2?'2024':'',country:mask&4?'TR':''};
  const f=fixture((path,bean,cb)=>cb(null,path.endsWith('getColumnContents')?{childColumnList:[{id:'cat-a',name:'Categoría A'},{id:'cat-b',name:'Categoría B'}]}:{assetList:[{contentId:root+'-'+page,name:'Matching title'}],totalSize:200,assetListTotalSize:200}));
  await invoke(f.core,'catalogBrowse',root,{pageNum:page,filters});const request=f.calls.at(-1),filtered=!!mask;
  assert.equal(String(request.bean.columnId),column||String(rootId));assert.equal(request.bean.pageNum,page);
  assert.equal(request.path,column&&!filtered?'v3/getShelveData':'v3/filterByContent');
  for(const [key,target] of [['genre','tags'],['year','year'],['country','originalCountry']])assert.equal(request.bean[target],filters[key]||undefined);
  checked++;
 }
 assert.equal(checked,240);
});
test('filter metadata keeps display labels separate from request identifiers, including zero',async()=>{
 const f=fixture((path,bean,cb)=>cb(null,{tags:[{key:0,value:'Todos'},{key:'drama-code',value:'Drama'},{key:'drama-code',value:'Duplicate'}],year:[{key:'2024',value:'Año 2024'}],originalCountry:[{key:'TR',value:'Turquía'}]}));
 const result=await invoke(f.core,'catalogFilters','series');assert.equal(result.genres[0].id,'0');assert.equal(result.genres[0].name,'Todos');assert.equal(result.genres[1].id,'drama-code');assert.equal(result.genres[1].name,'Drama');assert.equal(result.genres.length,2);assert.equal(result.countries[0].id,'TR');
});
test('a rejected category/filter combination never falls back to an unfiltered shelf',async()=>{
 const f=fixture((path,bean,cb)=>path.endsWith('getColumnContents')?cb(null,{childColumnList:[{id:'turkey',name:'Serie Turquía'}]}):cb(new Error('Combination rejected')));
 await assert.rejects(invoke(f.core,'catalogBrowse','series',{filters:{column:'turkey',year:'2024',genre:'drama-code',country:'TR'}}),/Combination rejected/);
 assert.deepEqual(f.calls.map(c=>c.path),['v3/getColumnContents','v3/filterByContent']);assert.equal(f.calls.at(-1).bean.tags,'drama-code');
});
test('documented explore and popular roots use the same scoped category routes',async()=>{
 for(const [root,id] of [['explore',76784],['popular',76301]]){
  const f=fixture((path,bean,cb)=>cb(null,path.endsWith('getColumnContents')?{childColumnList:[{id:'documented-child',name:'Colección'}]}:{assetList:[{contentId:'title',name:'Title'}],totalSize:1}));
  await invoke(f.core,'catalogColumns',root);assert.equal(f.calls[0].bean.columnId,id);
  const result=await invoke(f.core,'catalogBrowse',root,{});assert.equal(f.calls.at(-1).bean.columnId,'documented-child');assert.equal(result.resolvedColumn,'documented-child');assert.ok(f.calls.some(call=>call.path==='v3/getColumnContents'&&call.bean.columnId===id));
 }
});
