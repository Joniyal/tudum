import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id]/profile - Get user profile with stats
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Fetch user with habits and completions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        createdAt: true,
        habits: {
          select: {
            id: true,
            title: true,
            frequency: true,
            completions: {
              select: {
                id: true,
                completedAt: true,
              },
              orderBy: {
                completedAt: 'desc',
              },
            },
          },
          where: {
            // Only show habits to connected users or the owner
            OR: [
              { userId: session.user.id }, // User viewing their own profile
              {
                // Check if users are connected
                user: {
                  connectionsFrom: {
                    some: {
                      toUserId: session.user.id,
                      status: 'ACCEPTED',
                    },
                  },
                },
              },
              {
                user: {
                  connectionsTo: {
                    some: {
                      fromUserId: session.user.id,
                      status: 'ACCEPTED',
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate stats
    const totalHabits = user.habits.length;
    const allCompletions = user.habits.flatMap((h) => h.completions);
    const totalCompletions = allCompletions.length;

    // Calculate current streak (days with at least one completion)
    const uniqueDates = [...new Set(
      allCompletions.map((c) =>
        new Date(c.completedAt).toDateString()
      )
    )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();

    for (let i = 0; i < uniqueDates.length; i++) {
      const date = new Date(uniqueDates[i]);
      const diffDays = Math.floor(
        (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === i) {
        tempStreak++;
        if (i === 0 || diffDays === currentStreak) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    // Format response
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio,
      createdAt: user.createdAt,
      stats: {
        totalHabits,
        totalCompletions,
        currentStreak,
        longestStreak,
      },
      habits: user.habits.map((h) => ({
        id: h.id,
        title: h.title,
        frequency: h.frequency,
      })),
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
