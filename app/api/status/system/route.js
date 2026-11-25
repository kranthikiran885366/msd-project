import { NextResponse } from 'next/server';
export async function GET() {
  const backend = (process.env.INTERNAL_BACKEND_URL || process.env.API_URL || 'http://127.0.0.1:3001').replace(/\/$/,'');
  try {
    const response=await fetch(`${backend}/health/ready`,{cache:'no-store',signal:AbortSignal.timeout(5000)});
    const health=await response.json();
    return NextResponse.json({observedAt:new Date().toISOString(),status:response.ok?'operational':'unavailable',dependencies:{database:Boolean(health.database),queue:Boolean(health.queue)},uptime:null},{status:response.ok?200:503});
  } catch { return NextResponse.json({status:'unavailable',observedAt:new Date().toISOString(),uptime:null},{status:503}); }
}
