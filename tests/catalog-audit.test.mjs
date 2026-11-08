import test from 'node:test';import assert from 'node:assert/strict';import {createCatalogAudit} from '../browser/catalog-audit.js';
function core(fail=false){return {call(method,payload,cb){assert.equal(payload.fresh,true,'Physical audit must not substitute cached results');if(method==='catalogColumns')return cb(null,{columns:[{id:'turkey',name:'Serie Turquía'}]});if(method==='catalogFilters')return cb(null,{genres:[{id:'drama-code',name:'Drama'}],years:['2024'],countries:[{id:'TR',name:'Turquía'}]});if(fail&&payload.filters.column)return cb(new Error('Rejected'));cb(null,{items:[],total:0,hasMore:false});}};}
test('audit checks every exposed option with its request id and distinguishes errors from empty results',async()=>{
 const audit=createCatalogAudit(core(true));const report=await audit.run();assert.equal(report.entries.length,7);assert.equal(report.complete,true);assert.equal(report.errors,2);assert.equal(report.certifiesContents,false);assert.equal(report.entries.find(e=>e.kind==='country').filters.country,'TR');assert.equal(report.entries.find(e=>e.kind==='genre').filters.genre,'drama-code');assert.equal(report.entries.find(e=>e.kind==='year').state,'sin resultados');assert.equal(audit.snapshot(),report);
});
test('cancelled and bounded audits never claim complete coverage',async()=>{
 const audit=createCatalogAudit(core());let report=await audit.run({maxChecks:2});assert.equal(report.entries.length,2);assert.equal(report.complete,false);assert.equal(report.truncated,true);
 report=await audit.run({onProgress:()=>audit.cancel()});assert.equal(report.cancelled,true);assert.equal(report.entries.length,1);assert.equal(report.complete,false);
 await assert.rejects(audit.run({root:'adult'}),/no válida/);
});
test('metadata failure is explicit and does not certify all options',async()=>{
 const audit=createCatalogAudit({call(method,payload,cb){if(method==='catalogBrowse')cb(null,{items:[]});else cb(new Error('Unavailable'));}});const report=await audit.run();assert.equal(report.complete,false);assert.equal(report.metadataErrors.length,2);assert.equal(report.entries.length,1);
});
