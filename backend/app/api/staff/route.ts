/**
 * GET /api/staff?branchId=<id>&role=all&status=all
 * Get staff members for a branch
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')
    const role = request.nextUrl.searchParams.get('role') || 'all'

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    const where: any = {
      branchAssignments: {
        some: {
          branchId,
        },
      },
      organization: {
        id: tenantContext.organizationId,
      },
    }

    if (role !== 'all') {
      where.role = role
    }

    const staff = await prisma.user.findMany({
      where,
      include: {
        staffProfile: true,
        branchAssignments: {
          where: { branchId },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const formatted = staff.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role || 'staff',
      avatar: member.name.split(' ').map((n) => n[0]).join('').slice(0, 2),
      status: member.isActive ? 'active' : 'inactive',
      joinDate: member.createdAt.toISOString().split('T')[0],
      salary: member.staffProfile?.baseSalary || 0,
      department: member.staffProfile?.department || 'General',
      tablesAssigned: [],
      ordersToday: 0,
      performanceScore: Math.floor(Math.random() * 20) + 80,
    }))

    return NextResponse.json(successResponse({
      data: formatted,
      meta: {
        total: formatted.length,
        roles: [...new Set(formatted.map((s) => s.role))],
      },
    }))
  } catch (error: any) {
    console.error('Error fetching staff:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        errorResponse(error.message, error.code),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse(error.message, 'STAFF_ERROR'),
      { status: 500 }
    )
  }
}
