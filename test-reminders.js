const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReminders() {
  try {
    // Get current time
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;
    
    console.log('Current time:', currentTime);
    console.log('\nChecking all habits with reminders...\n');
    
    const habits = await prisma.habit.findMany({
      where: {
        reminderEnabled: true,
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
    
    console.log(`Found ${habits.length} habits with reminders enabled:\n`);
    
    habits.forEach(habit => {
      const matches = habit.reminderTime === currentTime;
      console.log(`- "${habit.title}" by @${habit.user.username}`);
      console.log(`  Reminder time: ${habit.reminderTime}`);
      console.log(`  Matches current time: ${matches ? '✅ YES' : '❌ NO'}`);
      console.log(`  Frequency: ${habit.frequency}`);
      console.log('');
    });
    
    if (habits.length === 0) {
      console.log('No habits with reminders found in database!');
      console.log('Make sure to:');
      console.log('1. Create a habit');
      console.log('2. Check "Set Reminder"');
      console.log('3. Set a reminder time');
      console.log('4. Save the habit');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkReminders();
