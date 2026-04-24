import { NextResponse } from 'next/server';

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

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { detail: error || 'Failed to remove item' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error('Error in portfolio delete route:', error);
    return NextResponse.json(
      { detail: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}