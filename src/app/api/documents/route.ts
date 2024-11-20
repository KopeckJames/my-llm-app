import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { getStorage } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401 }
      );
    }

    try {
      const storage = getStorage();
      const documents = await storage.getDocuments(session.user.email);
      return new NextResponse(
        JSON.stringify({ documents }), 
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch documents' }), 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';