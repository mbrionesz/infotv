import test from 'node:test';import assert from 'node:assert/strict';
import {addonPresets,playlistUrl,parsePlaylist,savedAddons} from '../browser/addons.js';
test('no external playlists are bundled automatically',()=>{assert.deepEqual(addonPresets,[]);});
test('M3U parser keeps comma-containing attributes, groups, relative streams and distinct stable IDs',()=>{
 const source='https://example.com/lists/chile.m3u';const text='#EXTM3U\n#EXTINF:-1 tvg-name="Uno" group-title="Chile, Noticias",Canal uno\n../live/uno.m3u8\n#EXTINF:-1,Otro\n#EXTGRP:Deportes\nhttps://cdn.example.com/dos.ts\n#EXTINF:-1,Duplicado\n../live/uno.m3u8\n#EXTINF:-1,Inseguro\njavascript:alert(1)';
 const rows=parsePlaylist(text,source);assert.equal(rows.length,2);assert.equal(rows[0].name,'Canal uno');assert.equal(rows[0].group,'Chile, Noticias');assert.equal(rows[0].streamUrl,'https://example.com/live/uno.m3u8');assert.equal(rows[1].group,'Deportes');assert.notEqual(rows[0].channelCode,rows[1].channelCode);assert.equal(parsePlaylist(text,source)[0].channelCode,rows[0].channelCode);assert.notEqual(parsePlaylist(text,'https://other.example/list.m3u')[1].channelCode,rows[1].channelCode);
});
test('a stream manifest or HTML is not accepted as a channel playlist',()=>{
 for(const text of ['<html>404</html>','#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXTINF:2,\nx.ts','#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000\nx.m3u8'])assert.throws(()=>parsePlaylist(text,'https://example.com/list.m3u'));
 assert.throws(()=>playlistUrl('file:///etc/passwd'));assert.throws(()=>playlistUrl('https://user:pass@example.com/list.m3u'));
});
test('custom list preferences tolerate corrupt storage and persist only valid definitions',()=>{
 assert.deepEqual(savedAddons({getItem:()=>'{broken'}),[]);const rows=savedAddons({getItem:()=>JSON.stringify([{name:'Casa',url:'https://example.com/list.m3u'}])});assert.equal(rows.length,1);assert.equal(rows[0].custom,true);assert.equal(rows[0].name,'Casa');
});
