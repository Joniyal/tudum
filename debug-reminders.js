const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const habits = await prisma.habit.findMany({
      where: { reminderEnabled: true },
      select: { id: true, title: true, reminderTime: true, reminderEnabled: true, userId: true }
    });
    
    console.log('Habits with reminders:', JSON.stringify(habits, null, 2));
    
    // Also get current time
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;
    
    console.log('\nCurrent server time:', currentTime);
    console.log('Full time:', now.toISOString());
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
