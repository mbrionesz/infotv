import test from 'node:test';import assert from 'node:assert/strict';
import {playlistTimelineIssue,clockOutsideBuffer,createPlaylistGrace} from '../browser/playlist-timeline.js';
const last={mediaSequence:10356,segments:6,targetDuration:5,atMs:7760,discontinuitySequence:null};
test('TV log regression 10356 -> 8905 is rejected before merging into HLS',()=>{
 assert.equal(playlistTimelineIssue(last,{...last,mediaSequence:8905},12758).kind,'media-sequence-regression');
 assert.equal(playlistTimelineIssue(last,{...last,mediaSequence:10358},17760),null);
 assert.equal(playlistTimelineIssue(last,{...last},12758),null);
});
test('hours of sequence advance within five seconds is rejected; real elapsed time allows missed updates',()=>{
 assert.equal(playlistTimelineIssue({...last,mediaSequence:8905},last,12758).kind,'media-sequence-jump');
 assert.equal(playlistTimelineIssue(last,{...last,mediaSequence:11807},last.atMs+1451*5000),null);
 assert.equal(playlistTimelineIssue(null,last,0),null);
 assert.equal(playlistTimelineIssue(last,{segments:0},12758),null);
});
test('a declared discontinuity must not go backwards; omitted tags remain valid',()=>{
 assert.equal(playlistTimelineIssue({...last,discontinuitySequence:8},{...last,discontinuitySequence:7},9000).kind,'discontinuity-sequence-regression');
 assert.equal(playlistTimelineIssue(last,{...last,discontinuitySequence:0},9000),null);
});
test('TV clock at 7317s with buffer ending 40s is a timeline failure, not missing network data',()=>{
 assert.equal(clockOutsideBuffer({time:7317.827,bufferEnd:40.139}),true);
 assert.equal(clockOutsideBuffer({time:6338.903,bufferEnd:40.24}),true);
 for(const sample of [{time:29,bufferEnd:40},{time:41,bufferEnd:40},{time:7317,bufferEnd:null},{time:7317,bufferEnd:0}])assert.equal(clockOutsideBuffer(sample),false);
});

test('several bad reloads preserve playable buffer instead of resetting after the third response',()=>{
 const grace=createPlaylistGrace();
 for(let i=0;i<5;i++)assert.ok(grace.next({now:i*1000,bufferSeconds:15-i,started:true}));
 assert.equal(grace.next({now:13000,bufferSeconds:8,started:true}),null);
});
test('playlist grace ends when the playable reserve is nearly exhausted and never waits forever on pause',()=>{
 const grace=createPlaylistGrace();grace.next({now:0,bufferSeconds:15,started:true});grace.next({now:250,bufferSeconds:15,started:true});
 assert.equal(grace.next({now:1000,bufferSeconds:2,started:true}),null);
 const paused=createPlaylistGrace();for(let i=0;i<3;i++)paused.next({now:i*1000,bufferSeconds:30,started:true});
 assert.equal(paused.next({now:12001,bufferSeconds:30,started:true}),null);
 const startup=createPlaylistGrace();assert.ok(startup.next({now:0,bufferSeconds:0,started:false}));assert.ok(startup.next({now:250,bufferSeconds:0,started:false}));assert.equal(startup.next({now:750,bufferSeconds:0,started:false}),null);
});
