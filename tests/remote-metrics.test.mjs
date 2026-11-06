import test from 'node:test';import assert from 'node:assert/strict';import {createRemoteMetrics} from '../browser/remote-metrics.js';
test('remote metrics distinguish JS processing from next frame, with a bounded history',()=>{
 let time=0,callback;const metrics=createRemoteMetrics({clock:()=>time,frame:fn=>callback=fn});
 metrics.measure(()=>{time+=2;return true;});time=16;callback();
 assert.equal(metrics.snapshot().handler.p95Ms,2);assert.equal(metrics.snapshot().nextAnimationFrame.p95Ms,16);
 for(let i=0;i<150;i++)metrics.measure(()=>{time+=1;});assert.equal(metrics.snapshot().handler.samples,120);
 const before=metrics.snapshot().handler.samples;metrics.measure(()=>false,true);assert.equal(metrics.snapshot().handler.samples,before);
});
