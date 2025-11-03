import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return mock incidents data
    const incidentsData = {
      incidents: [],
      resolved: [],
      scheduled: [
        {
          id: 'maint-001',
          title: 'Scheduled Maintenance',
          description: 'Database optimization',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          affectedServices: ['Database']
        }
      ]
    };

    return NextResponse.json(incidentsData);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}
