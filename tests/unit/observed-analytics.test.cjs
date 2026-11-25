'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createObservedAnalytics}=require('../../server/services/observedAnalytics');
test('analytics refuses a missing owner before querying storage',async()=>{
 const analytics=createObservedAnalytics({find(){assert.fail('Unscoped query');}});
 await assert.rejects(analytics.read(null),{status:401});
});
test('both analytics aggregations are scoped to owned project IDs',async()=>{
 let scope;const pipelines=[];
 const analytics=createObservedAnalytics({find(query){scope=query;return {select:()=>({lean:async()=>[{_id:'owned-project'}]})};}},{aggregate:async pipeline=>{pipelines.push(pipeline);return [];}},()=>new Date('2026-11-25T12:00:00Z'));
 const result=await analytics.read('owner-a',7);
 assert.deepEqual(scope,{userId:'owner-a'});
 for(const pipeline of pipelines)assert.deepEqual(pipeline[0].$match.projectId,{$in:['owned-project']});
 assert.equal(result.overview.totalDeployments,0);
 assert.equal(result.overview.uptime,null);
 assert.equal(result.history.length,7);
 assert.equal(result.history[0].date,'2026-11-19');
});
test('analytics rejects unbounded or malformed time windows',async()=>{
 const analytics=createObservedAnalytics();
 for(const value of [0,91,-1,'bad',2.5])await assert.rejects(analytics.read('owner',value),{status:400});
});
