import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { personalCategory, merchantName } = await req.json()
    const resolvedParams = await params
    const transactionId = resolvedParams.id

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: user.id
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(personalCategory !== undefined && { personalCategory }),
        ...(merchantName !== undefined && { merchantName })
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

    return NextResponse.json({
      transaction: {
        id: updatedTransaction.id,
        amount: updatedTransaction.amount,
        date: updatedTransaction.date,
        name: updatedTransaction.name,
        merchantName: updatedTransaction.merchantName,
        category: updatedTransaction.personalCategory || updatedTransaction.category || 'Other',
        isTransfer: updatedTransaction.isTransfer,
        account: updatedTransaction.account
      }
    })
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}