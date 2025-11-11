const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'habits' 
      ORDER BY ordinal_position
    `;
    
    console.log("=== HABIT TABLE COLUMNS ===");
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Try to fetch a habit with alarmDuration
    const habit = await prisma.habit.findFirst({
      where: { reminderEnabled: true },
      select: {
        id: true,
        title: true,
        reminderTime: true,
        alarmDuration: true,
      }
    });
    
    console.log("\n=== SAMPLE HABIT ===");
    console.log(JSON.stringify(habit, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
