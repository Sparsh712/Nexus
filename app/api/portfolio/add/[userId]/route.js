import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { userId } = params;
  
  try {
    const body = await request.json();
    console.log('Received request to add portfolio item:', { userId, body });

    // Check if NEXT_PUBLIC_API_URL is defined
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('NEXT_PUBLIC_API_URL is not defined');
      return NextResponse.json(
        { detail: 'API URL configuration error' },
        { status: 500 }
      );
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/add/${userId}`;
    console.log('Calling FastAPI endpoint:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log('FastAPI response:', response.status, responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response:', e);
      return NextResponse.json(
        { detail: 'Invalid response from API' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(responseData, { status: response.status });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in portfolio add API route:', error);
    return NextResponse.json(
      { detail: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}