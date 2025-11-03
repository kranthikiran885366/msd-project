import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a real application, you would check various services and systems
    // For now, we'll return a mock status
    const systemStatus = {
      overallStatus: 'operational',
      timestamp: new Date().toISOString(),
      services: [
        {
          name: 'API',
          status: 'operational',
          uptime: 99.99
        },
        {
          name: 'Database',
          status: 'operational',
          uptime: 99.95
        },
        {
          name: 'Storage',
          status: 'operational',
          uptime: 99.98
        },
        {
          name: 'CDN',
          status: 'operational',
          uptime: 99.99
        }
      ],
      lastIncident: null,
      metrics: {
        responseTime: 120, // ms
        requestsPerMinute: 850,
        errorRate: 0.01
      }
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