import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const startDate = from ? new Date(from) : subDays(new Date(), 30)
    const endDate = to ? new Date(to) : new Date()

    // Get account balances over time
    const balanceSnapshots = await prisma.balanceSnapshot.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        },
        account: {
          isActive: true
        }
      },
      include: {
        account: {
          select: {
            type: true,
            name: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    // Get manual assets
    const manualAssets = await prisma.manualAsset.findMany({
      where: { userId: user.id }
    })

    // Group balances by date
    const balancesByDate = new Map()

    for (const snapshot of balanceSnapshots) {
      const dateStr = format(snapshot.date, 'yyyy-MM-dd')
      
      if (!balancesByDate.has(dateStr)) {
        balancesByDate.set(dateStr, {
          date: dateStr,
          assets: 0,
          liabilities: 0,
          netWorth: 0,
          accounts: {}
        })
      }

      const dayData = balancesByDate.get(dateStr)
      
      if (snapshot.account.type === 'credit') {
        // Credit cards are liabilities (negative balance = debt)
        dayData.liabilities += Math.abs(snapshot.balance)
      } else {
        // Depository, investment, and manual are assets
        dayData.assets += snapshot.balance
      }
      
      dayData.accounts[snapshot.account.name] = {
        type: snapshot.account.type,
        balance: snapshot.balance
      }
    }

    // Add manual assets to each day (they don't change daily in v1)
    const totalManualAssets = manualAssets.reduce((sum, asset) => sum + asset.currentValue, 0)
    
    for (const dayData of Array.from(balancesByDate.values())) {
      dayData.assets += totalManualAssets
      dayData.netWorth = dayData.assets - dayData.liabilities
      
      manualAssets.forEach(asset => {
        dayData.accounts[asset.name] = {
          type: 'manual',
          balance: asset.currentValue
        }
      })
    }

    // Convert to sorted array
    const series = Array.from(balancesByDate.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    // Calculate current net worth and change from previous month
    let currentNetWorth = 0
    let previousMonthNetWorth = 0

    if (series.length > 0) {
      currentNetWorth = series[series.length - 1].netWorth
      
      const oneMonthAgo = subDays(new Date(), 30)
      const previousMonthData = series.find(item => 
        new Date(item.date) >= oneMonthAgo
      )
      
      if (previousMonthData) {
        previousMonthNetWorth = previousMonthData.netWorth
      }
    }

    const netWorthChange = currentNetWorth - previousMonthNetWorth

    return NextResponse.json({
      series,
      currentNetWorth,
      netWorthChange,
      totalAssets: series.length > 0 ? series[series.length - 1].assets : 0,
      totalLiabilities: series.length > 0 ? series[series.length - 1].liabilities : 0
    })
  } catch (error) {
    console.error('Get net worth series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}