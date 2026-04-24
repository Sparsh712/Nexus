import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { userId } = params;
  
  try {
    console.log('Fetching portfolio for user:', userId);

    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('NEXT_PUBLIC_API_URL is not defined');
      return NextResponse.json(
        { detail: 'API URL configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${userId}`);
    const responseText = await response.text();
    
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (e) {
      console.error('Error parsing response:', e, responseText);
      return NextResponse.json(
        { detail: 'Invalid response from API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in portfolio GET route:', error);
    return NextResponse.json(
      { detail: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { userId, itemId } = params;
  
  try {
    console.log('Removing portfolio item:', { userId, itemId });

    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('NEXT_PUBLIC_API_URL is not defined');
      return NextResponse.json(
        { detail: 'API URL configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${userId}/${itemId}`,
      { method: 'DELETE' }
    );

    const responseText = await response.text();
    
    try {
      const data = responseText ? JSON.parse(responseText) : { message: 'Item removed successfully' };
      return NextResponse.json(data, { status: response.status });
    } catch (e) {
      console.error('Error parsing response:', e, responseText);
      return NextResponse.json(
        { detail: 'Invalid response from API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in portfolio DELETE route:', error);
    return NextResponse.json(
      { detail: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}