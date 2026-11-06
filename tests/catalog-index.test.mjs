import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCatalogIndex} from '../browser/catalog-index.js';
test('21,000 synthetic titles remain indexed while only a bounded page is returned',()=>{
  const index=createCatalogIndex();const rows=Array.from({length:21000},(_,i)=>({id:String(i),title:'Título '+i,year:String(2020+i%4),country:i%2?'Chile':'México',genres:[i%2?'Drama':'Anime'],resolution:i%3?'1080p':'4K UHD'}));
  assert.equal(index.add('movies',rows),21000);assert.equal(index.add('movies',rows),0);
  const page=index.query('movies',{offset:100,limit:500});assert.equal(page.loaded,21000);assert.equal(page.total,21000);assert.equal(page.items.length,60);
  const filtered=index.query('movies',{limit:36,filters:{genre:'Drama',country:'Chile',year:'2021',resolution:'4K UHD'}});
  assert.ok(filtered.total>36);assert.equal(filtered.items.length,36);assert.ok(filtered.items.every(item=>item.year==='2021'&&item.country==='Chile'&&item.resolution==='4K UHD'));
  assert.equal(index.query('movies',{filters:{text:'titulo 20999'}}).items[0].id,'20999');
  assert.equal(index.query('series').total,0);
});
test('numeric quality codes do not invent resolution metadata',()=>{
  const index=createCatalogIndex();index.add('movies',[{id:'a',title:'Sin dato',quality:'3'},{id:'b',title:'HD',resolution:'1920x1080'}]);
  assert.deepEqual(index.query('movies').facets.resolutions,['1080p']);
  assert.equal(index.query('movies',{filters:{resolution:'1080p'}}).total,1);
});
