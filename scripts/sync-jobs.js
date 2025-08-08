const cron = require('node-cron')
const { PrismaClient } = require('@prisma/client')
const { syncAccountBalances, syncTransactions } = require('../src/lib/sync')

const prisma = new PrismaClient()

async function runSyncForUser(userId) {
  console.log(`Starting sync for user ${userId}`)
  
  try {
    await syncAccountBalances(userId)
    console.log(`✓ Synced balances for user ${userId}`)
    
    await syncTransactions(userId)
    console.log(`✓ Synced transactions for user ${userId}`)
  } catch (error) {
    console.error(`✗ Error syncing user ${userId}:`, error)
  }
}

async function runDailySync() {
  console.log('Running daily sync...')
  
  const dailyUsers = await prisma.user.findMany({
    where: { syncFrequency: 'daily' },
    select: { id: true }
  })
  
  for (const user of dailyUsers) {
    await runSyncForUser(user.id)
  }
  
  console.log(`Daily sync completed for ${dailyUsers.length} users`)
}

async function runWeeklySync() {
  console.log('Running weekly sync...')
  
  const weeklyUsers = await prisma.user.findMany({
    where: { syncFrequency: 'weekly' },
    select: { id: true }
  })
  
  for (const user of weeklyUsers) {
    await runSyncForUser(user.id)
  }
  
  console.log(`Weekly sync completed for ${weeklyUsers.length} users`)
}

// Daily sync at 2:00 AM
cron.schedule('0 2 * * *', runDailySync, {
  timezone: 'UTC'
})

// Weekly sync on Sunday at 2:00 AM
cron.schedule('0 2 * * 0', runWeeklySync, {
  timezone: 'UTC'
})

console.log('Sync jobs scheduled:')
console.log('- Daily sync: 2:00 AM UTC')
console.log('- Weekly sync: Sunday 2:00 AM UTC')

// Keep the process running
process.on('SIGINT', async () => {
  console.log('\nShutting down sync jobs...')
  await prisma.$disconnect()
  process.exit(0)
})