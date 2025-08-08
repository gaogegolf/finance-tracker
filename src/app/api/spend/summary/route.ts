import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get('month') // Format: YYYY-MM
    
    let targetDate: Date
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number)
      targetDate = new Date(year, month - 1, 1)
    } else {
      targetDate = new Date()
    }

    const startDate = startOfMonth(targetDate)
    const endDate = endOfMonth(targetDate)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        },
        isPending: false,
        isTransfer: false // Exclude transfers
      },
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        }
      }
    })

    let totalIncome = 0
    let totalSpending = 0
    const byCategory: Record<string, number> = {}
    const topMerchants: Record<string, number> = {}

    for (const txn of transactions) {
      const category = txn.personalCategory || txn.category[0] || 'Other'
      const merchant = txn.merchantName || txn.name
      
      if (txn.amount > 0) {
        totalIncome += txn.amount
      } else {
        const spendAmount = Math.abs(txn.amount)
        totalSpending += spendAmount
        
        byCategory[category] = (byCategory[category] || 0) + spendAmount
        topMerchants[merchant] = (topMerchants[merchant] || 0) + spendAmount
      }
    }

    // Sort categories by spending amount
    const sortedCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [category, amount]) => {
        acc[category] = amount
        return acc
      }, {} as Record<string, number>)

    // Get top 10 merchants
    const sortedMerchants = Object.entries(topMerchants)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [merchant, amount]) => {
        acc[merchant] = amount
        return acc
      }, {} as Record<string, number>)

    return NextResponse.json({
      month: format(targetDate, 'yyyy-MM'),
      totalIncome,
      totalSpending,
      netCashFlow: totalIncome - totalSpending,
      byCategory: sortedCategories,
      topMerchants: sortedMerchants
    })
  } catch (error) {
    console.error('Get spend summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}