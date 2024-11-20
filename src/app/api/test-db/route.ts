import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Try to perform a simple database query
    const result = await prisma.$queryRaw`SELECT 1+1 as result`;
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      result 
    });
  } catch (error: any) {
    console.log('Database connection error:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
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