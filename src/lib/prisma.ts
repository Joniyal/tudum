import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'minimal',
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Ensure connection is established
if (!globalForPrisma.prisma) {
  prisma.$connect().then(() => {
    console.log('✅ Database connected successfully')
  }).catch((e) => {
    console.error('❌ Failed to connect to database:', e.message)
    console.error('Database URL configured:', !!process.env.DATABASE_URL)
  })
}
