import test from 'node:test';import assert from 'node:assert/strict';import {playlistShape,playlistReason} from '../browser/playlist-shape.js';
test('only identical duplicate target durations are removed, without changing segments or credentials',()=>{
 const text='#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXT-X-TARGETDURATION:5\n#EXT-X-MEDIA-SEQUENCE:7\n#EXTINF:5,\nsegment.ts?token=test-only\n';const result=playlistShape(text);assert.equal(result.facts.targetDurationTags,2);assert.equal(result.facts.removedIdenticalTargetTags,1);assert.equal(result.facts.targetDuration,5);assert.equal((result.data.match(/TARGETDURATION/g)||[]).length,1);assert.ok(result.data.endsWith('segment.ts?token=test-only\n'));assert.equal(JSON.stringify(result.facts).includes('token'),false);
});
test('missing, conflicting or concatenated playlist metadata remains unmodified',()=>{
 for(const text of ['#EXTM3U\n#EXTINF:5,\ns.ts\n','#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXT-X-TARGETDURATION:6\n','#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXTM3U\n#EXT-X-TARGETDURATION:5\n'])assert.equal(playlistShape(text).data,text);
 assert.equal(playlistReason('Missing Target Duration'),'missing-target-duration');assert.equal(playlistReason('#EXT-X-TARGETDURATION must not appear more than once (private)'),'duplicate-target-duration');
});
