/**
 * GET /api/staff?branchId=<id>&role=all&status=all
 * Get staff members for a branch
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthContext } from '@/api/middleware/auth'
import { extractTenantContext } from '@/api/middleware/tenant'
import { successResponse, errorResponse } from '@/api/utils/responses'
import { ValidationError } from '@/api/utils/errors'
import { UserRepository } from '@/src/repositories'

const userRepo = new UserRepository()

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get('branchId')
    const role = request.nextUrl.searchParams.get('role') || 'all'

    if (!branchId) {
      throw new ValidationError('branchId is required')
    }

    const authContext = getMockAuthContext()
    const tenantContext = extractTenantContext(authContext)

    const filters: any[] = [
      { field: 'organizationId', operator: '==', value: tenantContext.organizationId },
    ]

    if (role !== 'all') {
      filters.push({ field: 'role', operator: '==', value: role })
    }

    const staff = await userRepo.findMany({
      filters,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 100,
    })

    const formatted = staff.map((member) => ({
      id: member.id,
      name: member.name || '',
      email: member.email,
      phone: member.phone || '',
      role: member.role || 'staff',
      avatar: (member.name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2),
      status: member.isActive ? 'active' : 'inactive',
      joinDate: member.createdAt instanceof Date 
        ? member.createdAt.toISOString().split('T')[0]
        : new Date(member.createdAt as any).toISOString().split('T')[0],
      salary: 0, // TODO: Fetch from staff profile
      department: 'General', // TODO: Fetch from staff profile
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
