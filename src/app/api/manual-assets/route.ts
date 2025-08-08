import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const manualAssets = await prisma.manualAsset.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ manualAssets })
  } catch (error) {
    console.error('Get manual assets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, currentValue } = await req.json()

    if (!name || typeof currentValue !== 'number' || currentValue < 0) {
      return NextResponse.json({ error: 'Name and valid current value required' }, { status: 400 })
    }

    const manualAsset = await prisma.manualAsset.create({
      data: {
        userId: user.id,
        name,
        currentValue
      }
    })

    return NextResponse.json({ manualAsset })
  } catch (error) {
    console.error('Create manual asset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}