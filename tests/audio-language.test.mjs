import test from 'node:test';import assert from 'node:assert/strict';import language from '../companion/lib/audio-language.js';import {selectTsAudioPmt} from '../browser/ts-audio-pmt.js';
test('language preference selects identified Latin Spanish before Spain, generic Spanish and Portuguese',()=>{
 const rows=[{lang:'por',name:'Português'},{lang:'es-ES',name:'Castellano'},{lang:'spa',name:'Español latino'},{lang:'es'}];assert.equal(language.chooseAudioTrack(rows,'es'),2);assert.equal(language.chooseAudioTrack(rows,'pt'),0);assert.equal(language.chooseAudioTrack([{lang:'por'}],'es'),-1);assert.equal(language.chooseAudioTrack([null,{language:'es_MX'}],'es'),1);assert.equal(language.describe(rows[2],2).name,'Español latino');assert.equal(language.languageOf('LAT'),'es');
});
function section(){const entries=['por','spa','spa'].flatMap((lang,index)=>[15,0xe1,index,0xf0,6,10,4,...Array.from(lang,c=>c.charCodeAt(0)),0]);const bytes=new Uint8Array(12+entries.length+4);bytes[0]=2;const length=bytes.length-3;bytes[1]=0xb0|(length>>8);bytes[2]=length&255;bytes[10]=0xf0;bytes[11]=0;bytes.set(entries,12);return bytes;}
test('TS PMT selection changes only selected audio PID and exposes real alternatives',()=>{
 const data=section(),before=data.slice();const pmt={common_pids:{h264:256,adts_aac:256}};let tracks,selected;
 selectTsAudioPmt(pmt,data,{xuperAudioLanguage:'es',xuperAudioLabels:'por,es-ES,es-MX',onXuperAudio:(rows,index)=>{tracks=rows;selected=index;}});assert.equal(selected,2);assert.equal(pmt.common_pids.adts_aac,258);assert.equal(pmt.common_pids.h264,256);assert.equal(tracks.length,3);assert.deepEqual(data,before);
 selectTsAudioPmt(pmt,data,{xuperAudioIndex:0});assert.equal(pmt.common_pids.adts_aac,256);
});
test('missing TS language metadata does not invent Spanish',()=>{const data=section();for(let i=0;i<data.length-2;i++)if(data[i]===10&&data[i+1]===4){data[i+2]=117;data[i+3]=110;data[i+4]=100;}const pmt={common_pids:{adts_aac:256}};let tracks;selectTsAudioPmt(pmt,data,{xuperAudioLanguage:'es',onXuperAudio:rows=>tracks=rows});assert.equal(pmt.common_pids.adts_aac,256);assert.equal(language.chooseAudioTrack(tracks,'es'),-1);});
