const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n=== ALL HABITS ===');
    const allHabits = await prisma.habit.findMany({
      select: { 
        id: true, 
        title: true, 
        reminderTime: true, 
        reminderEnabled: true,
        userId: true,
        frequency: true
      }
    });
    
    console.log(JSON.stringify(allHabits, null, 2));

    console.log('\n=== CURRENT UTC TIME ===');
    const now = new Date();
    const utcHours = String(now.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
    const currentUTC = `${utcHours}:${utcMinutes}`;
    
    console.log('UTC Time:', currentUTC);
    console.log('Full ISO:', now.toISOString());
    console.log('Local time:', now.toString());

    console.log('\n=== HABITS WITH REMINDERS ENABLED ===');
    const remindersEnabled = await prisma.habit.findMany({
      where: { reminderEnabled: true },
      select: { 
        id: true, 
        title: true, 
        reminderTime: true, 
        reminderEnabled: true,
        userId: true
      }
    });
    
    console.log(JSON.stringify(remindersEnabled, null, 2));
    console.log('Count:', remindersEnabled.length);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
