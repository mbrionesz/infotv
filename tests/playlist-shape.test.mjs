import test from 'node:test';import assert from 'node:assert/strict';import {playlistShape,playlistReason} from '../browser/playlist-shape.js';
test('only identical duplicate target durations are removed, without changing segments or credentials',()=>{
 const text='#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXT-X-TARGETDURATION:5\n#EXT-X-MEDIA-SEQUENCE:7\n#EXTINF:5,\nsegment.ts?token=test-only\n';const result=playlistShape(text);assert.equal(result.facts.targetDurationTags,2);assert.equal(result.facts.removedIdenticalTargetTags,1);assert.equal(result.facts.targetDuration,5);assert.equal((result.data.match(/TARGETDURATION/g)||[]).length,1);assert.ok(result.data.endsWith('segment.ts?token=test-only\n'));assert.equal(JSON.stringify(result.facts).includes('token'),false);
});
test('missing, conflicting or concatenated playlist metadata remains unmodified',()=>{
 for(const text of ['#EXTM3U\n#EXTINF:5,\ns.ts\n','#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXT-X-TARGETDURATION:6\n','#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXTM3U\n#EXT-X-TARGETDURATION:5\n'])assert.equal(playlistShape(text).data,text);
 assert.equal(playlistReason('Missing Target Duration'),'missing-target-duration');assert.equal(playlistReason('#EXT-X-TARGETDURATION must not appear more than once (private)'),'duplicate-target-duration');
});
test('sequence errors are not misclassified by TARGETDURATION in embedded playlist bodies',()=>{
 const body='media sequence mismatch 112: https://cdn.example/private.ts?token=secret\nPlaylist starting @110\n#EXTM3U\n#EXT-X-TARGETDURATION:5';
 assert.equal(playlistReason(body),'media-sequence-mismatch');assert.equal(playlistReason(body.replace('media sequence mismatch 112:','discontinuity sequence mismatch (0!=1)')),'discontinuity-sequence-mismatch');
});
test('debug message omits URLs, query credentials and embedded playlist bodies',async()=>{
 const {safeParserMessage}=await import('../browser/playlist-shape.js');const text=safeParserMessage('media sequence mismatch 112: https://cdn.example/private.ts?token=secret\n#EXT-X-KEY:URI="secret-key"');assert.equal(text,'media sequence mismatch 112: [URL omitida]');assert.equal(safeParserMessage('token=top-secret invalid playlist').includes('top-secret'),false);
 assert.equal(safeParserMessage('Authorization: Bearer private-token').includes('private-token'),false);
 const facts=playlistShape('#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:110\n#EXT-X-DISCONTINUITY-SEQUENCE:2\n#EXT-X-TARGETDURATION:5\n#EXTINF:5,\nsecret.ts\n').facts;assert.equal(facts.mediaSequence,110);assert.equal(facts.discontinuitySequence,2);assert.equal(JSON.stringify(facts).includes('secret'),false);
});
