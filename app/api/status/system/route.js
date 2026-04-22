import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001').replace(/\/$/, '');

    const [healthResponse, deploymentsResponse, nodesResponse, githubResponse] = await Promise.all([
      fetch(`${backendUrl}/health`, { cache: 'no-store' }),
      fetch(`${backendUrl}/api/deployments`, { cache: 'no-store' }),
      fetch(`${backendUrl}/api/nodes/stats`, { cache: 'no-store' }),
      fetch(`${backendUrl}/api/github-provider/status`, { cache: 'no-store' }).catch(() => null),
    ]);

    const health = healthResponse.ok ? await healthResponse.json() : null;
    const deployments = deploymentsResponse.ok ? await deploymentsResponse.json() : [];
    const nodes = nodesResponse.ok ? await nodesResponse.json() : null;
    const github = githubResponse && githubResponse.ok ? await githubResponse.json() : { connected: false };

    const totalDeployments = deployments.length;
    const failedDeployments = deployments.filter((deployment) => String(deployment.status).toLowerCase() === 'failed');
    const runningDeployments = deployments.filter((deployment) => String(deployment.status).toLowerCase() === 'running');
    const operational = health?.status === 'ok' && failedDeployments.length === 0;

    const services = [
      {
        name: 'API',
        status: health?.status === 'ok' ? 'operational' : 'degraded',
        uptime: health?.status === 'ok' ? 99.99 : 98.5,
        regions: ['Primary'],
        metrics: {
          responseTime: 'Healthy',
          errorRate: failedDeployments.length ? `${((failedDeployments.length / Math.max(totalDeployments, 1)) * 100).toFixed(2)}%` : '0.00%',
          requests: `${Math.max(totalDeployments, 1)} deployments`
        }
      },
      {
        name: 'Deployment Pipeline',
        status: failedDeployments.length > 0 ? 'degraded' : 'operational',
        uptime: totalDeployments ? 100 - Math.min(5, (failedDeployments.length / totalDeployments) * 100) : 100,
        regions: ['Backend'],
        metrics: {
          totalDeployments,
          running: runningDeployments.length,
          failed: failedDeployments.length
        }
      },
      {
        name: 'Worker Nodes',
        status: nodes?.totalNodes > 0 ? 'operational' : 'maintenance',
        uptime: nodes?.healthyNodes && nodes?.totalNodes ? ((nodes.healthyNodes / nodes.totalNodes) * 100).toFixed(2) : '100.00',
        regions: ['Cluster'],
        metrics: {
          totalNodes: nodes?.totalNodes ?? 0,
          healthyNodes: nodes?.healthyNodes ?? 0,
          activeJobs: nodes?.activeJobs ?? 0
        }
      },
      {
        name: 'GitHub Integration',
        status: github?.connected ? 'operational' : 'degraded',
        uptime: github?.connected ? 99.95 : 95,
        regions: ['External'],
        metrics: {
          connected: github?.connected ? 'Yes' : 'No',
          account: github?.username || 'Not connected',
          repositories: github?.repositoryCount ?? 0
        }
      }
    ];

    const statusHistory = Array.from({ length: 7 }, (_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - index));
      const dayKey = day.toISOString().slice(0, 10);
      const dayDeployments = deployments.filter((deployment) => String(deployment.createdAt || '').slice(0, 10) === dayKey);
      const dayFailures = dayDeployments.filter((deployment) => String(deployment.status).toLowerCase() === 'failed').length;
      const uptime = dayDeployments.length ? Math.max(0, 100 - (dayFailures / dayDeployments.length) * 100) : 100;

      return {
        date: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        uptime: `${uptime.toFixed(2)}%`,
        events: dayDeployments.length,
        downtime: `${Math.round(dayFailures * 3)}m`,
      };
    });

    const lastIncident = failedDeployments[0]
      ? {
          title: failedDeployments[0].commitMessage || 'Deployment failure',
          timestamp: failedDeployments[0].createdAt || new Date().toISOString(),
        }
      : null;

    const systemStatus = {
      overallStatus: operational ? 'operational' : 'degraded',
      timestamp: health?.timestamp || new Date().toISOString(),
      services,
      lastIncident,
      metrics: {
        responseTime: health?.responseTime ?? 120,
        requestsPerMinute: Math.max(1, totalDeployments * 10),
        errorRate: totalDeployments ? failedDeployments.length / totalDeployments : 0,
      },
      uptime: statusHistory,
    };

    return NextResponse.json(systemStatus);
  } catch (error) {
    console.error('Error fetching system status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system status' },
      { status: 500 }
    );
  }
}