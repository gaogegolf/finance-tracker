import { plaidClient, decryptToken } from './plaid'
import { prisma } from './prisma'
import { normalizeCategory, detectTransfer } from './categories'
import { startOfDay, subDays } from 'date-fns'

export async function syncAccountBalances(userId: string) {
  try {
    const institutions = await prisma.institution.findMany({
      where: { 
        userId,
        status: 'active'
      },
      include: {
        accounts: {
          where: { isActive: true }
        }
      }
    })

    for (const institution of institutions) {
      try {
        const accessToken = decryptToken(institution.plaidAccessToken)
        
        const response = await plaidClient.accountsBalanceGet({
          access_token: accessToken
        })

        const today = startOfDay(new Date())

        for (const plaidAccount of response.data.accounts) {
          const account = institution.accounts.find(
            acc => acc.plaidAccountId === plaidAccount.account_id
          )
          
          if (!account) continue

          const existingBalance = await prisma.balanceSnapshot.findUnique({
            where: {
              userId_accountId_date: {
                userId,
                accountId: account.id,
                date: today
              }
            }
          })

          if (!existingBalance) {
            await prisma.balanceSnapshot.create({
              data: {
                userId,
                accountId: account.id,
                date: today,
                balance: plaidAccount.balances.current || 0,
                source: 'plaid'
              }
            })
          }
        }
      } catch (error) {
        console.error(`Error syncing institution ${institution.id}:`, error)
        await prisma.institution.update({
          where: { id: institution.id },
          data: { status: 'error' }
        })
      }
    }

    await forwardFillMissingBalances(userId)
  } catch (error) {
    console.error('Error in syncAccountBalances:', error)
  }
}

export async function syncTransactions(userId: string) {
  try {
    const institutions = await prisma.institution.findMany({
      where: { 
        userId,
        status: 'active'
      },
      include: {
        accounts: {
          where: { isActive: true }
        }
      }
    })

    const startDate = subDays(new Date(), 30)
    const endDate = new Date()

    for (const institution of institutions) {
      try {
        const accessToken = decryptToken(institution.plaidAccessToken)
        
        const response = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          options: {
            count: 500
          }
        })

        const existingTransactions = await prisma.transaction.findMany({
          where: { userId },
          select: { id: true, amount: true, date: true, accountId: true, name: true }
        })

        for (const plaidTxn of response.data.transactions) {
          const account = institution.accounts.find(
            acc => acc.plaidAccountId === plaidTxn.account_id
          )
          
          if (!account) continue

          const existingTxn = await prisma.transaction.findUnique({
            where: { plaidTransactionId: plaidTxn.transaction_id }
          })

          if (existingTxn) continue

          const normalizedCategory = normalizeCategory(plaidTxn.category || [])
          const isTransfer = detectTransfer(existingTransactions, {
            amount: -plaidTxn.amount,
            date: new Date(plaidTxn.date),
            accountId: account.id,
            name: plaidTxn.name
          })

          await prisma.transaction.create({
            data: {
              userId,
              accountId: account.id,
              plaidTransactionId: plaidTxn.transaction_id,
              amount: -plaidTxn.amount, // Plaid uses negative for expenses
              date: new Date(plaidTxn.date),
              authorizedDate: plaidTxn.authorized_date ? new Date(plaidTxn.authorized_date) : null,
              name: plaidTxn.name,
              merchantName: plaidTxn.merchant_name,
              originalDescription: plaidTxn.original_description,
              category: plaidTxn.category ? plaidTxn.category[0] : null,
              personalCategory: normalizedCategory,
              isTransfer,
              isPending: false
            }
          })
        }
      } catch (error) {
        console.error(`Error syncing transactions for institution ${institution.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error in syncTransactions:', error)
  }
}

async function forwardFillMissingBalances(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { 
      userId,
      isActive: true
    }
  })

  for (const account of accounts) {
    const latestBalance = await prisma.balanceSnapshot.findFirst({
      where: { accountId: account.id },
      orderBy: { date: 'desc' }
    })

    if (!latestBalance) continue

    const today = startOfDay(new Date())
    const daysSinceLastBalance = Math.floor(
      (today.getTime() - latestBalance.date.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastBalance > 1) {
      const fillDate = startOfDay(new Date(latestBalance.date))
      fillDate.setDate(fillDate.getDate() + 1)

      while (fillDate < today) {
        const existingSnapshot = await prisma.balanceSnapshot.findUnique({
          where: {
            userId_accountId_date: {
              userId,
              accountId: account.id,
              date: fillDate
            }
          }
        })

        if (!existingSnapshot) {
          await prisma.balanceSnapshot.create({
            data: {
              userId,
              accountId: account.id,
              date: new Date(fillDate),
              balance: latestBalance.balance,
              source: 'forward_fill',
              isStale: true
            }
          })
        }

        fillDate.setDate(fillDate.getDate() + 1)
      }
    }
  }
}