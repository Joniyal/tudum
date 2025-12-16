import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateShareSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

// PATCH /api/habit-shares/[id] - Accept or reject a habit share invitation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateShareSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { status } = validation.data;
    const { id: shareId } = await params;

    // Find the habit share
    const habitShare = await prisma.habitShare.findUnique({
      where: { id: shareId },
      include: {
        habit: true,
      },
    });

    if (!habitShare) {
      return NextResponse.json({ error: 'Habit share not found' }, { status: 404 });
    }

    // Verify the current user is the recipient
    if (habitShare.toUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only respond to habit shares sent to you' },
        { status: 403 }
      );
    }

    // Check if already responded
    if (habitShare.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This habit share has already been responded to' },
        { status: 400 }
      );
    }

    // Update the habit share status
    const updatedShare = await prisma.habitShare.update({
      where: { id: shareId },
      data: {
        status,
        respondedAt: new Date(),
      },
    });

    // If accepted, create a copy of the habit for the recipient
    if (status === 'ACCEPTED') {
      const originalHabit = habitShare.habit;
      
      await prisma.habit.create({
        data: {
          title: originalHabit.title,
          description: originalHabit.description,
          frequency: originalHabit.frequency,
          reminderTime: originalHabit.reminderTime,
          reminderEnabled: originalHabit.reminderEnabled,
          alarmDuration: originalHabit.alarmDuration,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(updatedShare);
  } catch (error) {
    console.error('Error updating habit share:', error);
    return NextResponse.json(
      { error: 'Failed to update habit share' },
      { status: 500 }
    );
  }
}

// DELETE /api/habit-shares/[id] - Cancel a sent habit share invitation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: shareId } = await params;

    // Find the habit share
    const habitShare = await prisma.habitShare.findUnique({
      where: { id: shareId },
    });

    if (!habitShare) {
      return NextResponse.json({ error: 'Habit share not found' }, { status: 404 });
    }

    // Verify the current user is the sender
    if (habitShare.fromUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete habit shares you sent' },
        { status: 403 }
      );
    }

    // Delete the habit share
    await prisma.habitShare.delete({
      where: { id: shareId },
    });

    return NextResponse.json({ message: 'Habit share deleted successfully' });
  } catch (error) {
    console.error('Error deleting habit share:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit share' },
      { status: 500 }
    );
  }
}

// Update user to be admin
await prisma.user.updateMany({
  where: {
    email: 'your@email.com',
  },
  data: {
    isAdmin: true,
  },
});
