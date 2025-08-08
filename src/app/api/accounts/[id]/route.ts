import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isActive } = await req.json()
    const resolvedParams = await params
    const accountId = resolvedParams.id

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: user.id
      }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: { isActive }
    })

    return NextResponse.json({
      account: {
        id: updatedAccount.id,
        name: updatedAccount.name,
        isActive: updatedAccount.isActive
      }
    })
  } catch (error) {
    console.error('Update account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const resolvedParams = await params
    const account = await prisma.account.findFirst({
      where: {
        id: resolvedParams.id,
        userId: user.id
      }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const where: any = {
      accountId: resolvedParams.id,
      userId: user.id
    }

    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    const balances = await prisma.balanceSnapshot.findMany({
      where,
      orderBy: { date: 'asc' }
    })

    return NextResponse.json({ balances })
  } catch (error) {
    console.error('Get account balances error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}