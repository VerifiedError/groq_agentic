import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-middleware'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/models/[id]
 * Update model details (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { isActive, inputPricing, outputPricing, displayName } = body

    // Check if model exists
    const existingModel = await prisma.groqModel.findUnique({
      where: { id },
    })

    if (!existingModel) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (inputPricing !== undefined) updateData.inputPricing = inputPricing
    if (outputPricing !== undefined) updateData.outputPricing = outputPricing
    if (displayName !== undefined) updateData.displayName = displayName

    // Update model
    const updatedModel = await prisma.groqModel.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Model updated successfully',
      model: updatedModel,
    })
  } catch (error) {
    console.error('Error updating model:', error)
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    )
  }
}
