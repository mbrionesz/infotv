import test from 'node:test';import assert from 'node:assert/strict';
import {playlistUris,repairPlaylistUri} from '../browser/playlist-uris.js';
import {playlistShape} from '../browser/playlist-shape.js';
test('repairs a trailing host space while preserving signed path/query bytes and port',()=>{
 for(const gap of [' ','%20','%20%20',' %20']){
  const uri='https://nioo.wvdbozpfc.com'+gap+':8443/live/a%20b.ts?token=A%2FB&sig=x%20y#part';
  assert.equal(repairPlaylistUri(uri),'https://nioo.wvdbozpfc.com:8443/live/a%20b.ts?token=A%2FB&sig=x%20y#part');
 }
 assert.equal(repairPlaylistUri('//cdn.example%20/live.ts'),'//cdn.example/live.ts');
});
test('only recognized HLS URI locations are repaired, including keys/maps and variant lines',()=>{
 const text='#EXTM3U\r\n#EXT-X-TARGETDURATION:5\r\n#EXT-X-MEDIA-SEQUENCE:9\r\n#EXT-X-KEY:METHOD=AES-128,URI="https://key.example%20/key.bin?sig=secret%20"\r\n#EXT-X-MAP:URI="https://init.example /init.mp4"\r\n#EXT-X-MEDIA:TYPE=AUDIO,NAME="keep https://title.example%20/",URI="//audio.example%20/a.m3u8"\r\n#EXTINF:5,Title https://title.example%20/\r\nhttp://nioo.wvdbozpfc.com%20/live/p%20.ts?token=secret%20\r\n#EXT-X-CUSTOM:URI="https://other.example%20/"\r\n';
 const result=playlistShape(text);assert.equal(result.facts.repairedHostSpaces,4);assert.equal(result.facts.mediaSequence,9);assert.equal(result.facts.targetDuration,5);assert.ok(result.data.includes('http://nioo.wvdbozpfc.com/live/p%20.ts?token=secret%20\r\n'));assert.ok(result.data.includes('NAME="keep https://title.example%20/"'));assert.ok(result.data.includes('#EXT-X-CUSTOM:URI="https://other.example%20/"'));assert.ok(result.data.includes('Title https://title.example%20/'));assert.deepEqual(result.facts.uriHosts,['key.example','init.example','audio.example','nioo.wvdbozpfc.com']);assert.equal(JSON.stringify(result.facts).includes('secret'),false);
});
test('refuses ambiguous authorities, credentials and unrelated URI changes',()=>{
 for(const uri of ['https://a%20b.example/p','https://bad..example%20/p','https://-bad.example%20/p','https://cdn.example%2520/p','https://user@cdn.example%20/p','https://[::1]%20/p','https://cdn.example:443%20/p','https://cdn.example%20:99999/p','https://cdn.example/path%20?q=%20','part%20.ts?url=https://cdn.example%20/p','data:text/plain,https://cdn.example%20/p'])assert.equal(repairPlaylistUri(uri),uri);
 const concatenated='#EXTM3U\nhttps://cdn.example%20/a\n#EXTM3U\n';assert.equal(playlistUris(concatenated).data,concatenated);
});
test('host inventory is bounded and does not include path, query, userinfo or relative strings',()=>{
 const text='#EXTM3U\n'+Array.from({length:25},(_,i)=>'https://cdn'+i+'.example/a?token=private').join('\n')+'\nhttps://user:secret@private.example/a\nrelative.ts\n';const result=playlistUris(text);assert.equal(result.facts.uriHosts.length,16);assert.equal(JSON.stringify(result.facts).includes('private'),false);
});
