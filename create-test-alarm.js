const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createTestReminder() {
  try {
    // Get current UTC time
    const now = new Date();
    const currentUtcHours = now.getUTCHours();
    const currentUtcMinutes = now.getUTCMinutes();
    
    console.log(`Current UTC time: ${currentUtcHours}:${String(currentUtcMinutes).padStart(2, '0')}`);
    
    // Add 2 minutes
    let reminderMinutes = currentUtcMinutes + 2;
    let reminderHours = currentUtcHours;
    
    if (reminderMinutes >= 60) {
      reminderMinutes -= 60;
      reminderHours += 1;
    }
    
    if (reminderHours >= 24) {
      reminderHours -= 24;
    }
    
    const reminderTime = `${String(reminderHours).padStart(2, '0')}:${String(reminderMinutes).padStart(2, '0')}`;
    
    console.log(`Setting reminder for UTC time: ${reminderTime} (in 2 minutes)`);
    
    // Get first user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error("No user found!");
      return;
    }
    
    console.log(`Creating habit for user: ${user.email}`);
    
    // Create test habit
    const habit = await prisma.habit.create({
      data: {
        title: "Test Alarm",
        description: "Testing the alarm system",
        frequency: "DAILY",
        reminderTime: reminderTime,
        reminderEnabled: true,
        alarmDuration: 2, // 2 minutes
        userId: user.id,
      },
    });
    
    console.log("\n✅ Test habit created:");
    console.log(JSON.stringify(habit, null, 2));
    console.log(`\n⏰ Alarm should trigger at ${reminderTime} UTC (in ~2 minutes)`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestReminder();
