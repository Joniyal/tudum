const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function showAllReminders() {
  try {
    const habits = await prisma.habit.findMany({
      where: { reminderEnabled: true },
      select: {
        id: true,
        title: true,
        reminderTime: true,
        alarmDuration: true,
        userId: true,
        user: {
          select: {
            email: true,
          }
        }
      },
      orderBy: { reminderTime: 'asc' }
    });
    
    const now = new Date();
    const currentUtcTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
    
    console.log("=== CURRENT TIME ===");
    console.log("UTC:", currentUtcTime);
    console.log("India (UTC+5:30):", convertUTCToIndia(currentUtcTime));
    console.log("");
    
    console.log("=== ALL HABITS WITH REMINDERS ===");
    habits.forEach((habit, index) => {
      const indiaTime = convertUTCToIndia(habit.reminderTime);
      const isPast = habit.reminderTime < currentUtcTime;
      const status = isPast ? "❌ PAST" : "✅ FUTURE";
      
      console.log(`${index + 1}. "${habit.title}" (${habit.user.email})`);
      console.log(`   UTC: ${habit.reminderTime} → India: ${indiaTime} ${status}`);
      console.log(`   Alarm Duration: ${habit.alarmDuration === -1 ? 'Until completed' : habit.alarmDuration + ' minutes'}`);
      console.log("");
    });
    
    console.log("=== INSTRUCTIONS ===");
    console.log("To test the alarm:");
    console.log(`1. Current time is ${convertUTCToIndia(currentUtcTime)} India`);
    const futureMinutes = now.getUTCMinutes() + 2;
    const futureHours = futureMinutes >= 60 ? now.getUTCHours() + 1 : now.getUTCHours();
    const normalizedMinutes = futureMinutes >= 60 ? futureMinutes - 60 : futureMinutes;
    const futureTimeIndia = convertUTCToIndia(`${String(futureHours % 24).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`);
    console.log(`2. Create a habit with reminder time: ${futureTimeIndia} India`);
    console.log("3. Wait for the notification!");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function convertUTCToIndia(utcTime) {
  const [hours, minutes] = utcTime.split(':').map(Number);
  
  // Add 5 hours 30 minutes (330 minutes)
  let totalMinutes = hours * 60 + minutes + 330;
  
  // Handle day wrap
  if (totalMinutes >= 1440) { // 24 hours = 1440 minutes
    totalMinutes -= 1440;
  }
  
  const indiaHours = Math.floor(totalMinutes / 60);
  const indiaMinutes = totalMinutes % 60;
  
  // Convert to 12-hour format
  let hour12 = indiaHours % 12;
  if (hour12 === 0) hour12 = 12;
  const period = indiaHours < 12 ? 'AM' : 'PM';
  
  return `${String(hour12).padStart(2, '0')}:${String(indiaMinutes).padStart(2, '0')} ${period}`;
}

showAllReminders();
