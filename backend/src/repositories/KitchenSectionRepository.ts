/**
 * Kitchen Section Repository
 * Handles all Firestore operations for Kitchen Section documents
 * 
 * Features:
 * - CRUD operations with audit fields
 * - Soft delete and restore
 * - Tenant isolation (branch scoped)
 * - Advanced filtering and pagination
 * - Transaction and batch support
 * 
 * Usage:
 *   const repo = new KitchenSectionRepository()
 *   const section = await repo.create(data, userId, orgId)
 *   const found = await repo.findById(id)
 *   const updated = await repo.update(id, updates, userId)
 */

import { BaseRepository, IRepository } from './'
import {
  KitchenSectionDocument,
  CreateKitchenSectionPayload,
  UpdateKitchenSectionPayload,
  KitchenSectionType,
} from '../types/firestore'
import { COLLECTIONS } from '../firestore/collections'
import { QueryOptions, CreateResult, UpdateResult } from '../types/firestore'

export class KitchenSectionRepository extends BaseRepository<KitchenSectionDocument>
  implements IRepository<KitchenSectionDocument> {
  constructor() {
    super(COLLECTIONS.kitchenSections)
  }

  /**
   * Find kitchen sections by branch
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @param options - Query options for filtering and ordering
   * @returns Array of kitchen sections
   */
  async findByBranch(
    branchId: string,
    organizationId: string,
    options?: QueryOptions
  ): Promise<KitchenSectionDocument[]> {
    const filters = [
      { field: 'branchId', operator: '==' as const, value: branchId },
      { field: 'organizationId', operator: '==' as const, value: organizationId },
      ...(options?.filters || []),
    ]

    return this.findMany({
      ...options,
      filters,
      orders: [
        { field: 'displayOrder', direction: 'asc' },
        ...(options?.orders || []),
      ],
    })
  }

  /**
   * Find active kitchen sections by branch
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of active kitchen sections
   */
  async findActiveSections(
    branchId: string,
    organizationId: string
  ): Promise<KitchenSectionDocument[]> {
    return this.findByBranch(
      branchId,
      organizationId,
      {
        filters: [
          { field: 'isActive', operator: '==', value: true },
        ],
      }
    )
  }

  /**
   * Find kitchen section by name in a branch
   * @param branchId - Branch ID
   * @param name - Section name
   * @param organizationId - Organization ID
   * @returns Kitchen section or null
   */
  async findByName(
    branchId: string,
    name: string,
    organizationId: string
  ): Promise<KitchenSectionDocument | null> {
    const results = await this.findMany({
      filters: [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'name', operator: '==' as const, value: name },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })

    return results.length > 0 ? results[0] : null
  }

  /**
   * Find kitchen sections by type
   * @param sectionType - Type of section
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Array of kitchen sections
   */
  async findByType(
    sectionType: KitchenSectionType,
    branchId: string,
    organizationId: string
  ): Promise<KitchenSectionDocument[]> {
    return this.findMany({
      filters: [
        { field: 'sectionType', operator: '==' as const, value: sectionType },
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Count kitchen sections in a branch
   * @param branchId - Branch ID
   * @param organizationId - Organization ID
   * @returns Count of kitchen sections
   */
  async countByBranch(
    branchId: string,
    organizationId: string
  ): Promise<number> {
    return this.count({
      filters: [
        { field: 'branchId', operator: '==' as const, value: branchId },
        { field: 'organizationId', operator: '==' as const, value: organizationId },
      ],
    })
  }

  /**
   * Update kitchen section status
   * @param sectionId - Section ID
   * @param isActive - Active status
   * @param userId - User performing update
   * @returns Update result
   */
  async updateStatus(
    sectionId: string,
    isActive: boolean,
    userId: string
  ): Promise<UpdateResult<KitchenSectionDocument>> {
    return this.update(
      sectionId,
      { isActive } as Partial<KitchenSectionDocument>,
      userId
    )
  }

  /**
   * Update kitchen section display order
   * @param sectionId - Section ID
   * @param displayOrder - New display order
   * @param userId - User performing update
   * @returns Update result
   */
  async updateDisplayOrder(
    sectionId: string,
    displayOrder: number,
    userId: string
  ): Promise<UpdateResult<KitchenSectionDocument>> {
    return this.update(
      sectionId,
      { displayOrder } as Partial<KitchenSectionDocument>,
      userId
    )
  }
}

export type {
  KitchenSectionDocument,
  CreateKitchenSectionPayload,
  UpdateKitchenSectionPayload,
}
