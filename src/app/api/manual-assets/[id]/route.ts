import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, currentValue } = await req.json()
    const resolvedParams = await params
    const assetId = resolvedParams.id

    const asset = await prisma.manualAsset.findFirst({
      where: {
        id: assetId,
        userId: user.id
      }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const updatedAsset = await prisma.manualAsset.update({
      where: { id: assetId },
      data: {
        ...(name !== undefined && { name }),
        ...(currentValue !== undefined && { currentValue })
      }
    })

    return NextResponse.json({ manualAsset: updatedAsset })
  } catch (error) {
    console.error('Update manual asset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const assetId = resolvedParams.id

    const asset = await prisma.manualAsset.findFirst({
      where: {
        id: assetId,
        userId: user.id
      }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    await prisma.manualAsset.delete({
      where: { id: assetId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete manual asset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}