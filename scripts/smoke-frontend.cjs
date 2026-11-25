#!/usr/bin/env node
'use strict';
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
async function main(){
 const port=Number(process.env.SMOKE_FRONTEND_PORT||5117);
 const origin=`http://127.0.0.1:${port}`;
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
 let serverError='';server.stderr.on('data',chunk=>{serverError=(serverError+chunk).slice(-4000);});
 try{
  let ready=false;const deadline=Date.now()+20000;
  while(Date.now()<deadline){if(server.exitCode!==null)throw new Error(`Frontend exited before startup: ${serverError}`);try{const response=await fetch(origin,{signal:AbortSignal.timeout(1000)});if(response.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,200));}
  assert.ok(ready,'Frontend did not become ready');
  for(const [route,text]of [['/','Good ideas'],['/docs','A clear first deployment'],['/login','Welcome back'],['/signup','Build something great'],['/verify-email','Make your workspace yours']]){
   const response=await fetch(origin+route);assert.equal(response.status,200,`${route} HTTP status`);const html=await response.text();assert.ok(html.includes(text),`${route} server-rendered content`);
   const stylesheet=html.match(/href="([^\"]+\.css(?:\?[^\"]*)?)"/);
   if(stylesheet){assert.equal((await fetch(new URL(stylesheet[1].replaceAll('&amp;','&'),origin))).status,200,`${route} CSS asset`);}
   console.log(`PASS HTTP + SSR + stylesheet: ${route}`);
  }
  console.log('Browser interaction and visual layout were not exercised by this HTTP check.');
 }finally{server.kill('SIGTERM');}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
