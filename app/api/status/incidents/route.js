import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001').replace(/\/$/, '');
    const response = await fetch(`${backendUrl}/api/deployments`, { cache: 'no-store' });
    const deployments = response.ok ? await response.json() : [];

    const incidents = deployments
      .filter((deployment) => String(deployment.status).toLowerCase() === 'failed')
      .slice(0, 10)
      .map((deployment, index) => ({
        id: deployment._id || deployment.id || `incident-${index}`,
        title: deployment.commitMessage || deployment.gitCommit || 'Deployment failure'
        ,
        description: deployment.error || deployment.failureReason || 'Deployment failed on the backend',
        status: 'resolved',
        duration: deployment.deployTime ? `${Math.max(1, Math.round(deployment.deployTime / 60))}m` : 'unknown',
        impact: deployment.environment || 'production',
        createdAt: deployment.createdAt || new Date().toISOString(),
      }));

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}
