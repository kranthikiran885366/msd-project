'use strict';
const http=require('http');
const httpProxy=require('http-proxy');
function createGateway({baseDomain,lookup}) {
  if(!baseDomain||!/^[a-z0-9.-]+$/i.test(baseDomain)||typeof lookup!=='function')throw new Error('A valid application domain and deployment lookup are required');
  const suffix=String(baseDomain).toLowerCase();
  function identity(req){try{const host=new URL(`http://${req.headers.host}`).hostname.toLowerCase();const ending='.'+suffix;if(!host.endsWith(ending))return null;const id=host.slice(0,-ending.length);return /^[a-f\d]{24}$/i.test(id)?id:null;}catch{return null;}}
  const proxy=httpProxy.createProxyServer({xfwd:true,ws:true,changeOrigin:false,proxyTimeout:30000,timeout:30000});
  proxy.on('proxyRes',(response,req,res)=>{response.headers['x-clouddeck-deployment']=req.clouddeckDeployment;response.headers['x-content-type-options']='nosniff';});
  proxy.on('error',(error,req,res)=>{if(typeof res.writeHead==='function'){if(!res.headersSent)res.writeHead(502,{'Content-Type':'text/plain'});res.end('Application gateway unavailable');}else res.destroy();});
  async function route(req){const id=identity(req);if(!id)return null;const resolved=await lookup(id);if(!resolved)return null;const target=new URL(resolved.target);if(target.protocol!=='http:'||target.username||target.password||!target.port||Number(target.port)<1024)throw new Error('Invalid application target');req.clouddeckDeployment=id;return target.origin;}
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/_clouddeck/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'gateway-up'}));return;}
    try{const target=await route(req);if(!target){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Application not found');return;}proxy.web(req,res,{target});}
    catch{res.writeHead(503,{'Content-Type':'text/plain'});res.end('Application routing unavailable');}
  });
  server.on('upgrade',async(req,socket,head)=>{try{const target=await route(req);if(!target)return socket.destroy();proxy.ws(req,socket,head,{target});}catch{socket.destroy();}});
  server.on('close',()=>proxy.close());
  return server;
}
async function start(){
  require('dotenv').config();
  const baseDomain=process.env.APPS_BASE_DOMAIN;
  const secret=process.env.WORKER_SECRET;
  const backend=process.env.BACKEND_URL;
  if(!secret||!backend)throw new Error('WORKER_SECRET and BACKEND_URL are required by the gateway');
  const server=createGateway({baseDomain,lookup:async id=>{const response=await fetch(new URL(`/api/deployments/${id}/gateway`,backend),{headers:{Authorization:`Bearer ${secret}`},signal:AbortSignal.timeout(5000)});if(response.status===404)return null;if(!response.ok)throw new Error('Deployment lookup failed');return response.json();}});
  server.listen(Number(process.env.GATEWAY_PORT||8080),'0.0.0.0');
  process.once('SIGTERM',()=>server.close());process.once('SIGINT',()=>server.close());
}
if(require.main===module)start().catch(error=>{console.error('[gateway] Startup failed:',error.message);process.exit(1);});
module.exports={createGateway,start};
