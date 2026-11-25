const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const realFetch=global.fetch;
afterEach(()=>{global.fetch=realFetch;});
const client=()=>import('../../lib/api-client.js').then(m=>{m.default.retryDelay=1;m.default.token=null;return m.default;});
test('failed deployment POSTs are not retried automatically',async()=>{const api=await client();let calls=0;global.fetch=async()=>{calls++;return new Response(JSON.stringify({error:'queue unavailable'}),{status:503});};await assert.rejects(api.createDeployment({projectId:'test'}),/queue unavailable/);assert.equal(calls,1);});
test('a lost POST response is treated as uncertain, not submitted again',async()=>{const api=await client();let calls=0;global.fetch=async()=>{calls++;throw new Error('connection reset');};await assert.rejects(api.createProject({name:'test'}),/Network error/);assert.equal(calls,1);});
test('read-only GET requests retain bounded retry behavior',async()=>{const api=await client();let calls=0;global.fetch=async()=>{calls++;return calls<3?new Response('{}',{status:503}):new Response('[]',{status:200});};assert.deepEqual(await api.getProjects(),[]);assert.equal(calls,3);});
