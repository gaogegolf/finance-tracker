import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const accountId = searchParams.get('accountId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')

    const where: any = {
      userId: user.id,
      isPending: false
    }

    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    if (accountId) {
      where.accountId = accountId
    }

    if (category) {
      where.OR = [
        { personalCategory: category },
        { category: { has: category } }
      ]
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { merchantName: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (cursor) {
      where.id = { lt: cursor }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: limit
    })

    const nextCursor = transactions.length === limit ? transactions[transactions.length - 1].id : null

    return NextResponse.json({
      transactions: transactions.map(txn => ({
        id: txn.id,
        amount: txn.amount,
        date: txn.date,
        name: txn.name,
        merchantName: txn.merchantName,
        category: txn.personalCategory || txn.category[0] || 'Other',
        isTransfer: txn.isTransfer,
        account: txn.account
      })),
      nextCursor
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}