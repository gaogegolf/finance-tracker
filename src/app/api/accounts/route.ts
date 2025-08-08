import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.account.findMany({
      where: { 
        userId: user.id,
        isActive: true
      },
      include: {
        institution: {
          select: {
            institutionName: true,
            status: true
          }
        },
        balanceSnapshots: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    })

    const manualAssets = await prisma.manualAsset.findMany({
      where: { userId: user.id }
    })

    const accountsWithBalances = accounts.map(account => ({
      id: account.id,
      name: account.name,
      mask: account.mask,
      type: account.type,
      subtype: account.subtype,
      institutionName: account.institution?.institutionName,
      institutionStatus: account.institution?.status,
      balance: account.balanceSnapshots[0]?.balance || 0,
      lastUpdated: account.balanceSnapshots[0]?.date || account.createdAt
    }))

    const manualAssetsFormatted = manualAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: 'manual',
      subtype: 'crypto',
      balance: asset.currentValue,
      lastUpdated: asset.updatedAt
    }))

    return NextResponse.json({
      accounts: [...accountsWithBalances, ...manualAssetsFormatted]
    })
  } catch (error) {
    console.error('Get accounts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}