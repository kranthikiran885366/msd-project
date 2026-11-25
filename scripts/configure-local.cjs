#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {randomBytes}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const files=['.env.docker','server/.env','runner-agent/.env','.env.local'];
for(const file of files)if(fs.existsSync(path.join(root,file)))throw new Error(`Refusing to overwrite ${file}; preserve your existing keys and data`);
const key=()=>randomBytes(36).toString('base64url');
const jwt=key(),worker=key(),metrics=key(),mongo=key(),encryption=key();
const common=`JWT_SECRET=${jwt}\nENCRYPTION_KEY=${encryption}\nWORKER_SECRET=${worker}\nMETRICS_USERNAME=operator\nMETRICS_PASSWORD=${metrics}\n`;
const local='NODE_ENV=development\nCLIENT_URL=http://localhost:5000\nBACKEND_PUBLIC_URL=http://localhost:3001\nBACKEND_PORT=3001\nPORT_RANGE_START=4100\nPORT_RANGE_END=4999\n';
const settings={
 'server/.env':local+common+'MONGODB_URI=mongodb://127.0.0.1:27017/clouddeck\nREDIS_URL=redis://127.0.0.1:6379\n',
 'runner-agent/.env':`WORKER_SECRET=${worker}\n`+'NODE_ENV=development\nBACKEND_URL=http://localhost:3001\nAPPS_BASE_DOMAIN=localhost\nGATEWAY_INTERNAL_URL=http://127.0.0.1:8080\nBACKEND_PUBLIC_URL=http://localhost:3001\nREDIS_URL=redis://127.0.0.1:6379\nNODE_ID=local-worker\nNODE_PRIVATE_IP=127.0.0.1\nNODE_PUBLIC_IP=127.0.0.1\nMAX_CONCURRENT_JOBS=1\nWORKER_AGENT_PORT=4000\nPORT_RANGE_START=4100\nPORT_RANGE_END=4999\n',
 '.env.local':'NEXT_PUBLIC_API_URL=\nINTERNAL_BACKEND_URL=http://127.0.0.1:3001\nNEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=false\n',
 '.env.docker':local.replace('CLIENT_URL=http://localhost:5000','CLIENT_URL=http://localhost:3000')+common+`MONGO_INITDB_ROOT_USERNAME=clouddeck\nMONGO_INITDB_ROOT_PASSWORD=${mongo}\nMONGO_INITDB_DATABASE=clouddeck\nMONGODB_URI=mongodb://clouddeck:${mongo}@mongodb:27017/clouddeck?authSource=admin\nREDIS_URL=redis://redis:6379\nREDIS_HOST=redis\nREDIS_PORT=6379\nBACKEND_URL=http://backend:3001\nBACKEND_PRIVATE_IP=backend\nNODE_ID=compose-worker\nNODE_PRIVATE_IP=worker\nNODE_PUBLIC_IP=127.0.0.1\nMAX_CONCURRENT_JOBS=1\nWORKER_AGENT_PORT=4000\nREGION=us-east-1\nNEXT_PUBLIC_API_URL=\nDEPLOYMENT_STRATEGY=internal\nDOCKER_ENABLED=true\nAPPS_BASE_DOMAIN=localhost\n`,
};
for(const [file,content]of Object.entries(settings))fs.writeFileSync(path.join(root,file),content,{flag:'wx',mode:0o600});
console.log('Created private local configuration with independent random secrets. No keys were printed.');
console.log('Local mode is for operator-owned test repositories. Read docs/PRODUCT_AUDIT.md before public deployment.');
