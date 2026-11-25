#!/usr/bin/env node
'use strict';
// Run only against a dedicated disposable platform. Creates records; never deletes existing user data.
const {randomBytes}=require('node:crypto');
async function main(){
 if(process.env.SMOKE_ALLOW_DATA_CREATION!=='true')throw new Error('Set SMOKE_ALLOW_DATA_CREATION=true only for a dedicated test environment');
 const base=process.env.SMOKE_API_URL;if(!base)throw new Error('SMOKE_API_URL is required');
 let token;
 async function call(endpoint,options={}){const response=await fetch(new URL(endpoint,base),{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},signal:AbortSignal.timeout(30000)});const body=await response.json();if(!response.ok)throw new Error(`${endpoint} returned ${response.status}: ${body.error||'request failed'}`);return body;}
 const password=randomBytes(24).toString('base64url');const email=`smoke-${Date.now()}-${randomBytes(4).toString('hex')}@example.test`;
 const session=await call('/auth/signup',{method:'POST',body:JSON.stringify({name:'Disposable smoke account',email,password,confirmPassword:password})});token=session.token;
 const profile=await call('/auth/profile');if(profile.email!==email)throw new Error('Profile owner mismatch');
 const project=await call('/api/projects',{method:'POST',body:JSON.stringify({name:`smoke-${Date.now()}`,framework:'Other',repository:{provider:'github',owner:'kranthikiran885366',name:'-food-recipe-website-html-css-js',url:'https://github.com/kranthikiran885366/-food-recipe-website-html-css-js.git',branch:'main',deployOnPush:false},runtimeConfig:{runtime:'static',port:80},deploymentSettings:{autoDeploy:false}})});
 const listed=await call('/api/projects');if(!listed.some(p=>p._id===project._id))throw new Error('Created project missing from owner list');
 const observed=await call('/api/dashboard');if(!observed.projects.some(p=>p._id===project._id))throw new Error('Dashboard project mismatch');
 console.log('PASS: actual signup → profile → persistent project → list → dashboard');
 if(process.env.SMOKE_RUN_DEPLOYMENT!=='true'){console.log('NOT RUN: Docker deployment. Set SMOKE_RUN_DEPLOYMENT=true with a configured isolated worker.');return;}
 const deployment=await call('/api/deployments',{method:'POST',body:JSON.stringify({projectId:project._id,gitBranch:'main',environment:'preview',commitMessage:'Authorized disposable end-to-end smoke test'})});
 const deadline=Date.now()+600000;let current;
 while(Date.now()<deadline){current=await call(`/api/deployments/${deployment._id}`);if(['running','failed','cancelled'].includes(current.status))break;await new Promise(resolve=>setTimeout(resolve,2000));}
 if(current?.status!=='running')throw new Error(`Deployment did not reach running (${current?.status||'unknown'})`);
 const url=current.previewUrl||current.productionUrl;if(!url)throw new Error('Running record lacks an application URL');
 const app=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!app.ok)throw new Error(`Actual application returned ${app.status}`);
 console.log('PASS: actual queue → worker → Git clone → Docker build → HTTP-ready application');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
