import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createShareSchema = z.object({
  habitId: z.string().cuid(),
  toUserId: z.string().cuid(),
  message: z.string().optional(),
});

// POST /api/habit-shares - Create a habit share invitation
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = createShareSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { habitId, toUserId, message } = validation.data;

    // Verify the habit belongs to the sender
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { userId: true, title: true },
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    if (habit.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only share your own habits' },
        { status: 403 }
      );
    }

    // Verify the recipient exists and is a connected partner
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { fromUserId: session.user.id, toUserId: toUserId, status: 'ACCEPTED' },
          { fromUserId: toUserId, toUserId: session.user.id, status: 'ACCEPTED' },
        ],
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'You can only share habits with connected partners' },
        { status: 400 }
      );
    }

    // Check if there's already a pending or accepted share
    const existingShare = await prisma.habitShare.findFirst({
      where: {
        habitId,
        toUserId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });

    if (existingShare) {
      return NextResponse.json(
        { error: 'This habit is already shared with this user' },
        { status: 400 }
      );
    }

    // Create the habit share
    const habitShare = await prisma.habitShare.create({
      data: {
        habitId,
        fromUserId: session.user.id,
        toUserId,
        message,
        status: 'PENDING',
      },
      include: {
        habit: {
          select: {
            title: true,
            description: true,
            frequency: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(habitShare, { status: 201 });
  } catch (error) {
    console.error('Error creating habit share:', error);
    return NextResponse.json(
      { error: 'Failed to create habit share' },
      { status: 500 }
    );
  }
}

// GET /api/habit-shares - Get pending habit share invitations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'received' or 'sent'

    let where: any = {};

    if (type === 'received') {
      where = {
        toUserId: session.user.id,
        status: 'PENDING',
      };
    } else if (type === 'sent') {
      where = {
        fromUserId: session.user.id,
      };
    } else {
      // Default: get all pending invitations received
      where = {
        toUserId: session.user.id,
        status: 'PENDING',
      };
    }

    const habitShares = await prisma.habitShare.findMany({
      where,
      include: {
        habit: {
          select: {
            id: true,
            title: true,
            description: true,
            frequency: true,
            reminderTime: true,
            reminderEnabled: true,
            alarmDuration: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(habitShares);
  } catch (error) {
    console.error('Error fetching habit shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit shares' },
      { status: 500 }
    );
  }
}
