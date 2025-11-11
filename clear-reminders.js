const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Deleting all habits with reminders...');
    
    const deleted = await prisma.habit.deleteMany({
      where: { reminderEnabled: true }
    });
    
    console.log(`Deleted ${deleted.count} habits with reminders`);
    
    console.log('\nRemaining habits:');
    const remaining = await prisma.habit.findMany({
      select: { id: true, title: true, reminderEnabled: true }
    });
    console.log(JSON.stringify(remaining, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
