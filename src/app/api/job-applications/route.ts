import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const applications = await prisma.document.findMany({
      where: { 
        userId: user.id,
        type: 'job-application'
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(applications.map(doc => ({
      id: doc.id,
      ...JSON.parse(doc.content)
    })));
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    const application = await prisma.document.create({
      data: {
        userId: user.id,
        type: 'job-application',
        name: `${data.company} - ${data.dateOfApplication}`,
        content: JSON.stringify(data),
        metadata: {
          company: data.company,
          status: data.status,
          dateOfApplication: data.dateOfApplication
        }
      },
    });

    return NextResponse.json({
      id: application.id,
      ...data
    });
  } catch (error) {
    console.error('Error creating job application:', error);
    return NextResponse.json(
      { error: 'Failed to create job application' },
      { status: 500 }
    );
  }
}