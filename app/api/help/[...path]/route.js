import { NextResponse } from 'next/server'

export async function GET(request) {
  const { pathname } = new URL(request.url)
  const path = pathname.replace('/api/help/', '')

  try {
    const response = await fetch(`${process.env.BACKEND_URL}/api/help/${path}`, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      // Forward auth headers if present
      ...(request.headers.get('authorization') && {
        headers: {
          'Authorization': request.headers.get('authorization'),
        },
      }),
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
    const response = await fetch(`${process.env.BACKEND_URL}/api/help/${path}`, {
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