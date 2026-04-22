import { NextResponse } from 'next/server'

export async function GET(request) {
  const { pathname } = new URL(request.url)
  const path = pathname.replace('/api/help/', '')

  try {
    const backendUrl = (process.env.BACKEND_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001').replace(/\/$/, '')
    const response = await fetch(`${backendUrl}/api/help/${path}`, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization'),
        }),
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Help API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch help content' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const { pathname } = new URL(request.url)
  const path = pathname.replace('/api/help/', '')

  try {
    const body = await request.json()
    const backendUrl = (process.env.BACKEND_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001').replace(/\/$/, '')
    const response = await fetch(`${backendUrl}/api/help/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization'),
        }),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Help API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process help request' },
      { status: 500 }
    )
  }
}