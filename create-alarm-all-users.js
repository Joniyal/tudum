// DELETE ALL OLD HABITS AND CREATE NEW TEST FOR YOUR CURRENT USER

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function setupTestAlarm() {
  try {
    console.log("=== DELETING OLD TEST HABITS ===");
    
    // Delete all test habits
    const deleted = await prisma.habit.deleteMany({
      where: {
        title: {
          contains: "Test",
        },
      },
    });
    
    console.log(`Deleted ${deleted.count} test habits`);
    
    console.log("\n=== CREATING NEW TEST ALARMS FOR ALL USERS ===");
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
      }
    });
    
    // Create alarm 2 minutes from now
    const now = new Date();
    const futureTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
    const reminderTime = `${String(futureTime.getUTCHours()).padStart(2, '0')}:${String(futureTime.getUTCMinutes()).padStart(2, '0')}`;
    
    const currentIndiaTime = convertUTCToIndia(`${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`);
    const futureIndiaTime = convertUTCToIndia(reminderTime);
    
    console.log(`Current time: ${currentIndiaTime} India`);
    console.log(`Alarm will trigger at: ${futureIndiaTime} India (${reminderTime} UTC)`);
    console.log("");
    
    // Create habit for each user
    for (const user of users) {
      const habit = await prisma.habit.create({
        data: {
          title: `🚨 TEST ALARM - ${user.email.split('@')[0]}`,
          description: "This alarm will trigger in 2 minutes!",
          frequency: "DAILY",
          userId: user.id,
          reminderEnabled: true,
          reminderTime: reminderTime,
          alarmDuration: 2, // 2 minute alarm
        },
      });
      
      console.log(`✅ Created test alarm for ${user.email}`);
      console.log(`   ID: ${habit.id}`);
    }
    
    console.log("\n⏰ ALL TEST ALARMS CREATED!");
    console.log(`⏰ They will trigger at ${futureIndiaTime} India (in ~2 minutes)`);
    console.log("\n📱 Keep the browser tab open and watch for:");
    console.log("   1. Console log: [REMINDERS-TAB] Triggering alarm for: TEST ALARM");
    console.log("   2. Full-screen red AlarmModal");
    console.log("   3. Looping beep sound");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function convertUTCToIndia(utcTime) {
  const [hours, minutes] = utcTime.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes + 330;
  if (totalMinutes >= 1440) totalMinutes -= 1440;
  const indiaHours = Math.floor(totalMinutes / 60);
  const indiaMinutes = totalMinutes % 60;
  let hour12 = indiaHours % 12;
  if (hour12 === 0) hour12 = 12;
  const period = indiaHours < 12 ? 'AM' : 'PM';
  return `${String(hour12).padStart(2, '0')}:${String(indiaMinutes).padStart(2, '0')} ${period}`;
}

setupTestAlarm();
