import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { getStorage } from '@/lib/storage';

// Configure segment runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Define the params interface to match Next.js expectations
interface RequestContext {
  params: {
    id: string;
  };
}

type AuthContext = RequestContext & {
  auth: {
    user?: {
      email?: string;
    };
  };
};

// Handler for GET requests
export async function GET(
  _req: NextRequest,
  context: RequestContext
) {
  try {
    const storage = getStorage();
    const document = await storage.getDocument(context.params.id);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error retrieving document:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document' }, 
      { status: 500 }
    );
  }
}

// Handler for DELETE requests
export async function DELETE(
  _req: NextRequest,
  context: RequestContext
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const storage = getStorage();
    const document = await storage.getDocument(context.params.id);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' }, 
        { status: 404 }
      );
    }

    if (document.userId !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    await storage.deleteDocument(context.params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' }, 
      { status: 500 }
    );
  }
}