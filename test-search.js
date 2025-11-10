const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearch(searchQuery) {
  try {
    console.log('Searching for:', searchQuery);
    console.log('Query (lowercase):', searchQuery.toLowerCase());
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchQuery.toLowerCase(), mode: "insensitive" } },
          { name: { contains: searchQuery, mode: "insensitive" } },
          { email: { contains: searchQuery.toLowerCase(), mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
      },
      take: 20,
    });
    
    console.log('\nResults found:', users.length);
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`- @${user.username} - ${user.name || 'No name'}`);
      });
    } else {
      console.log('No users found!');
      console.log('\nTrying exact username match...');
      
      const exactMatch = await prisma.user.findUnique({
        where: { username: searchQuery.toLowerCase() },
        select: { username: true, name: true, email: true },
      });
      
      if (exactMatch) {
        console.log('Found exact match:', exactMatch);
      } else {
        console.log('No exact match found either');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get search query from command line
const query = process.argv[2] || 'kai';
testSearch(query);
