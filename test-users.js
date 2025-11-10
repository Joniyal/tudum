const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUsers() {
  try {
    console.log('Connecting to database...');
    
    const count = await prisma.user.count();
    console.log('Total users in database:', count);
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
      },
      take: 10,
    });
    
    console.log('\nUsers:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Name: ${user.name || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUsers();
