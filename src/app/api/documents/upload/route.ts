import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { getStorage } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401 }
      );
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string;

      if (!file) {
        return new NextResponse(
          JSON.stringify({ error: 'No file provided' }), 
          { status: 400 }
        );
      }

      const content = await file.text();
      const storage = getStorage();
      
      const document = await storage.saveDocument({
        id: '', // will be generated by the database
        userId: session.user.email,
        type,
        name: file.name,
        content,
        uploadedAt: new Date(),
        metadata: {
          fileType: file.type,
          size: file.size,
        },
      });

      return new NextResponse(
        JSON.stringify({ success: true, document }), 
        { status: 200 }
      );
    } catch (processError) {
      console.error('Processing error:', processError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to process document' }), 
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

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb',
  },
};