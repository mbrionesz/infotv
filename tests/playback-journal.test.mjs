import test from 'node:test';import assert from 'node:assert/strict';import {createPlaybackJournal} from '../browser/playback-journal.js';
test('journal persists bounded metadata, deduplicates and drops URLs, headers and tokens',()=>{
 let saved='',time=10;const storage={getItem:()=>saved,setItem:(k,v)=>saved=v};const j=createPlaybackJournal({storage:()=>storage,now:()=>time});
 j.push({channel:'News',host:'cdn.example',kind:'stall',engine:'hls.js',status:200,url:'https://cdn.example/private?token=secret',headers:{Authorization:'secret'}});time++;j.push({channel:'News',host:'cdn.example',kind:'stall',engine:'hls.js',status:200});j.flush();assert.equal(j.entries()[0].count,2);assert.equal(saved.includes('secret'),false);assert.equal(saved.includes('private'),false);
 for(let i=0;i<120;i++){time+=11000;j.push({kind:'stall',host:'cdn.example',channel:'Channel '+i});}j.flush();assert.equal(j.entries().length,100);const restored=createPlaybackJournal({storage:()=>storage});assert.equal(restored.entries().length,100);restored.flush();
});
test('corrupt or inaccessible storage does not break playback',()=>{
 for(const storage of [()=>{throw Error('denied')},()=>({getItem:()=>'{bad',setItem(){}})]){const j=createPlaybackJournal({storage});assert.deepEqual(j.entries(),[]);j.push({kind:'start'});j.flush();assert.equal(j.entries().length,1);}
});
