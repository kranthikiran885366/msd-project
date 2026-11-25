const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const validateEnvironment = require('../../server/config/validateEnvironment');
const { canTransition } = require('../../server/services/deploymentState');
const JobExecutor = require('../../runner-agent/jobExecutor');
const service = require('../../server/services/dashboardService');
const Project = require('../../server/models/Project');
const { authorizeProject, authorizeDeployment } = require('../../server/middleware/resourceOwnership');
const Deployment = require('../../server/models/Deployment');
const projectExists = Project.exists;
const deploymentFind = Deployment.findById;
afterEach(()=>{ Project.exists=projectExists; Deployment.findById=deploymentFind; });
function response() {return {statusCode:200,status(n){this.statusCode=n;return this;},json(data){this.body=data;return this;}};}
test('production refuses default secrets and missing persistent services',()=>{
 assert.throws(()=>validateEnvironment({NODE_ENV:'production'}),/JWT_SECRET.*WORKER_SECRET.*MONGODB_URI/);
 assert.doesNotThrow(()=>validateEnvironment({NODE_ENV:'production',JWT_SECRET:'x'.repeat(40),WORKER_SECRET:'y'.repeat(40),METRICS_PASSWORD:'z'.repeat(40),MONGODB_URI:'mongodb://db/platform',REDIS_URL:'redis://queue',CLIENT_URL:'https://console.example.test'}));
});
test('cancelled/failed deployments cannot be resurrected by a late worker',()=>{
 for(const state of ['failed','cancelled','rolled-back']) for(const next of ['building','deploying','running']) assert.equal(canTransition(state,next),false);
 assert.equal(canTransition('building','running'),false);assert.equal(canTransition('deploying','running'),true);
 assert.equal(canTransition('running','nonsense'),false);
});
test('statistics use canonical running state; empty history is unknown',()=>{
 assert.equal(service.calculateProjectStats([],[],[]).successRate,null);
 const stats=service.calculateProjectStats([{}],[{status:'running',buildTime:20},{status:'failed',buildTime:40}],[]);
 assert.equal(stats.successRate,50); assert.equal(stats.avgBuildTimeSeconds,30);assert.equal(stats.uptime,null);
});
test('project endpoint hides another tenant’s resource',async()=>{
 let query;Project.exists=async filter=>{query=filter;return null;};const res=response();let next=false;
 await authorizeProject({params:{id:'a'.repeat(24)},body:{},userId:'owner-b'},res,()=>{next=true;});
 assert.equal(res.statusCode,404);assert.equal(query.userId,'owner-b');assert.equal(next,false);
});
test('deployment access checks the owning project rather than the deployment author',async()=>{
 Deployment.findById=()=>({select:()=>({lean:async()=>({projectId:'b'.repeat(24)})})});Project.exists=async()=>null;
 const res=response();await authorizeDeployment({params:{id:'c'.repeat(24)},body:{},userId:'other'},res,()=>assert.fail('tenant boundary bypass'));
 assert.equal(res.statusCode,404);
});
test('malformed IDs never reach the database',async()=>{
 Project.exists=async()=>assert.fail('invalid ID reached database');const res=response();await authorizeProject({params:{id:'bad'},userId:'owner'},res,()=>assert.fail());assert.equal(res.statusCode,404);
});
test('root directory resolution rejects traversal and symlink escape',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'clouddeck-root-'));const repo=path.join(dir,'repo');await fs.mkdir(repo);await fs.mkdir(path.join(dir,'outside'));
 await fs.symlink(path.join(dir,'outside'),path.join(repo,'escape'));
 const worker=new JobExecutor('test','http://localhost:3001');
 try{assert.equal(await worker.resolveRoot(repo,'.'),repo);await assert.rejects(worker.resolveRoot(repo,'../outside'),/inside/);await assert.rejects(worker.resolveRoot(repo,'escape'),/inside/);}finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('unknown repositories fail instead of receiving a fabricated deployed page',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'clouddeck-empty-'));const worker=new JobExecutor('test','http://localhost:3001');worker.log=async()=>{};
 try{await assert.rejects(worker.ensureDockerfile('a'.repeat(24),dir),/No supported runtime/);await assert.rejects(fs.access(path.join(dir,'index.html')));}finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('generated build recipes preserve failures instead of bypassing commands',()=>{
 const worker=new JobExecutor('test','http://localhost:3001');for(const type of ['nextjs','node','react','vue','go']){
  const file=worker.makeDockerfile(type,{installCommand:'npm ci',buildCommand:'npm run build',startCommand:'npm start',runtime:{}});
  assert.doesNotMatch(file,/build skipped|legacy-peer-deps|\|\| true/);
 }
});
test('runtime detection distinguishes Vite output from Create React App',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'clouddeck-vite-'));const worker=new JobExecutor('test','http://localhost:3001');
 try{await fs.writeFile(path.join(dir,'package.json'),JSON.stringify({dependencies:{react:'19',vite:'6'}}));const runtime=await worker.detectRuntime(dir);assert.equal(worker._defaultOutput(runtime),'dist');}finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('HTTP readiness refuses an exited container',async()=>{const worker=new JobExecutor('test','http://localhost:3001');worker.isRunning=async()=>false;await assert.rejects(worker.waitForHealthy('stopped',1234,100),/exited/);});
test('port allocation never fabricates an unreserved port',async()=>{const worker=new JobExecutor('test','http://localhost:3001');worker.client.post=async()=>{throw new Error('unavailable')};await assert.rejects(worker.allocatePort('id'),/unreserved/);});
test('runtime secrets use a private temporary env file and are removed afterwards',async()=>{
 const worker=new JobExecutor('test','http://localhost:3001');let file;let args;
 worker.exec=async(id,cmd,values)=>{args=values;file=values[values.indexOf('--env-file')+1];assert.equal((await fs.stat(file)).mode & 0o777,0o600);assert.equal(await fs.readFile(file,'utf8'),'API_KEY=private-test-value');};
 await worker.runContainer('d'.repeat(24),'image','container',4101,'/tmp',{API_KEY:'private-test-value'},8080);
 assert.equal(args.includes('private-test-value'),false);assert.ok(args.includes('PORT=8080'));await assert.rejects(fs.access(file));
});
test('environment values cannot inject additional env-file entries',async()=>{const worker=new JobExecutor('test','http://localhost:3001');await assert.rejects(worker.runContainer('e'.repeat(24),'image','container',4101,'/tmp',{KEY:'first\nINJECTED=value'},8080),/Invalid environment/);});
test('worker honors cancellation reported by the control plane',async()=>{const worker=new JobExecutor('test','http://localhost:3001');worker.client.get=async()=>({status:200,data:{status:'cancelled'}});await assert.rejects(worker.assertActive('id'),/no longer active/);});
