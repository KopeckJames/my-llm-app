import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test user creation
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });

    // Test document creation
    const testDoc = await prisma.document.create({
      data: {
        userId: testUser.id,
        type: 'test',
        name: 'Test Document',
        content: 'Test Content',
        metadata: {
          fileType: 'text/plain',
          size: 123
        }
      }
    });

    // Fetch all users and documents
    const users = await prisma.user.findMany({
      include: {
        documents: true
      }
    });

    return NextResponse.json({ 
      success: true,
      data: {
        testUser,
        testDoc,
        users
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: {
        code: error.code,
        meta: error.meta
      }
    }, { status: 500 });
  }
}