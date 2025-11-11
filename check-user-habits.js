const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUserHabits() {
  try {
    const now = new Date();
    const currentUtcTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      }
    });
    
    console.log("=== ALL USERS ===");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name || 'No name'}) - ID: ${user.id}`);
    });
    
    console.log("\n=== HABITS WITH REMINDERS DUE NOW ===");
    console.log("Current UTC time:", currentUtcTime);
    
    // Check previous minute too
    const prevMinute = new Date(now.getTime() - 60000);
    const prevTime = `${String(prevMinute.getUTCHours()).padStart(2, '0')}:${String(prevMinute.getUTCMinutes()).padStart(2, '0')}`;
    
    const dueHabits = await prisma.habit.findMany({
      where: {
        reminderEnabled: true,
        reminderTime: {
          in: [currentUtcTime, prevTime],
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          }
        }
      }
    });
    
    if (dueHabits.length === 0) {
      console.log("❌ No habits due at", currentUtcTime, "or", prevTime);
    } else {
      dueHabits.forEach((habit, index) => {
        console.log(`${index + 1}. "${habit.title}" - ${habit.reminderTime}`);
        console.log(`   Owner: ${habit.user.email} (${habit.user.name || 'No name'})`);
        console.log(`   User ID: ${habit.userId}`);
        console.log(`   Habit ID: ${habit.id}`);
      });
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserHabits();
