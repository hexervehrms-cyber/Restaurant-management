/**
 * Bill Item Repository
 * Handles all bill item-related Firestore operations
 * Replaces Prisma BillItem model operations with Firestore
 */

import { BaseRepository } from './BaseRepository'
import { COLLECTIONS } from '../config/collections'
import { BaseDocument, UpdateResult, CreateResult } from '../types/firestore'

/**
 * Bill Item Document Model for Firestore
 */
export interface BillItem extends BaseDocument {
  // Identifiers
  billId: string
  menuItemId?: string
  
  // Foreign Keys
  organizationId: string
  
  // Item Information
  itemName: string
  basePrice: string // Decimal as string
  quantity: number
  itemTotal: string // Decimal as string
  
  // Calculations
  discountAmount: string // Decimal as string
  taxAmount: string // Decimal as string
  lineTotal: string // Decimal as string
}

/**
 * Bill Item creation payload
 */
export interface CreateBillItemPayload {
  billId: string
  menuItemId?: string
  organizationId: string
  itemName: string
  basePrice: string | number
  quantity: number
  itemTotal: string | number
  discountAmount?: string | number
  taxAmount?: string | number
  lineTotal: string | number
}

/**
 * Bill Item update payload
 */
export interface UpdateBillItemPayload {
  basePrice?: string | number
  quantity?: number
  itemTotal?: string | number
  discountAmount?: string | number
  taxAmount?: string | number
  lineTotal?: string | number
}

/**
 * Bill Item Repository
 * Extends BaseRepository with BillItem-specific operations
 */
export class BillItemRepository extends BaseRepository<BillItem> {
  constructor() {
    super(COLLECTIONS.billItems)
  }

  /**
   * Find bill items by bill ID
   *
   * @example
   *   const items = await billItemRepo.findByBill(billId)
   */
  async findByBill(billId: string): Promise<BillItem[]> {
    try {
      return await this.findMany({
        filters: [{ field: 'billId', operator: '==', value: billId }],
        orders: [{ field: 'createdAt', direction: 'asc' }],
      })
    } catch (error) {
      console.error('Error finding bill items by bill:', error)
      return []
    }
  }

  /**
   * Count items in bill
   *
   * @example
   *   const count = await billItemRepo.countByBill(billId)
   */
  async countByBill(billId: string): Promise<number> {
    try {
      return await this.count({
        filters: [{ field: 'billId', operator: '==', value: billId }],
      })
    } catch (error) {
      console.error('Error counting bill items:', error)
      return 0
    }
  }

  /**
   * Calculate total for all items in bill
   *
   * @example
   *   const total = await billItemRepo.calculateBillItemsTotal(billId)
   */
  async calculateBillItemsTotal(billId: string): Promise<number> {
    try {
      const items = await this.findByBill(billId)

      return items.reduce((sum, item) => {
        const lineTotal = parseFloat(item.lineTotal) || 0
        return sum + lineTotal
      }, 0)
    } catch (error) {
      console.error('Error calculating bill items total:', error)
      return 0
    }
  }

  /**
   * Calculate tax total for all items in bill
   *
   * @example
   *   const taxTotal = await billItemRepo.calculateBillTaxTotal(billId)
   */
  async calculateBillTaxTotal(billId: string): Promise<number> {
    try {
      const items = await this.findByBill(billId)

      return items.reduce((sum, item) => {
        const taxAmount = parseFloat(item.taxAmount) || 0
        return sum + taxAmount
      }, 0)
    } catch (error) {
      console.error('Error calculating bill tax total:', error)
      return 0
    }
  }

  /**
   * Calculate discount total for all items in bill
   *
   * @example
   *   const discountTotal = await billItemRepo.calculateBillDiscountTotal(billId)
   */
  async calculateBillDiscountTotal(billId: string): Promise<number> {
    try {
      const items = await this.findByBill(billId)

      return items.reduce((sum, item) => {
        const discountAmount = parseFloat(item.discountAmount) || 0
        return sum + discountAmount
      }, 0)
    } catch (error) {
      console.error('Error calculating bill discount total:', error)
      return 0
    }
  }

  /**
   * Find bill items by menu item ID
   * Used to understand which bills contain a specific item
   *
   * @example
   *   const billItems = await billItemRepo.findByMenuItem(menuItemId, orgId)
   */
  async findByMenuItem(menuItemId: string, organizationId: string): Promise<BillItem[]> {
    try {
      return await this.findMany({
        filters: [
          { field: 'menuItemId', operator: '==', value: menuItemId },
          { field: 'organizationId', operator: '==', value: organizationId },
        ],
        orders: [{ field: 'createdAt', direction: 'desc' }],
      })
    } catch (error) {
      console.error('Error finding bill items by menu item:', error)
      return []
    }
  }

  /**
   * Delete all bill items for a bill
   * Used when bill is cancelled or reset
   *
   * @example
   *   const result = await billItemRepo.deleteByBill(billId, userId)
   */
  async deleteByBill(billId: string, userId: string): Promise<{ success: boolean; count: number }> {
    try {
      const items = await this.findByBill(billId)
      let count = 0

      for (const item of items) {
        const result = await this.delete(item.id!, userId)
        if (result.success) {
          count++
        }
      }

      return {
        success: true,
        count,
      }
    } catch (error) {
      console.error('Error deleting bill items:', error)
      return {
        success: false,
        count: 0,
      }
    }
  }

  /**
   * Batch create bill items
   * Creates multiple items at once
   *
   * @example
   *   const result = await billItemRepo.batchCreate(
   *     billId,
   *     items,
   *     userId
   *   )
   */
  async batchCreate(
    billId: string,
    items: Array<Omit<CreateBillItemPayload, 'billId'>>,
    userId: string,
    organizationId: string
  ): Promise<CreateResult<BillItem[]>> {
    try {
      const createdItems: BillItem[] = []

      for (const item of items) {
        const billItemPayload: Omit<BillItem, keyof BaseDocument> = {
          billId,
          menuItemId: item.menuItemId,
          itemName: item.itemName,
          basePrice: typeof item.basePrice === 'string' ? item.basePrice : item.basePrice.toString(),
          quantity: item.quantity,
          itemTotal: typeof item.itemTotal === 'string' ? item.itemTotal : item.itemTotal.toString(),
          discountAmount: item.discountAmount !== undefined && item.discountAmount !== null ? this.toDecimalString(item.discountAmount) : '0.00',
          taxAmount: item.taxAmount !== undefined && item.taxAmount !== null ? this.toDecimalString(item.taxAmount) : '0.00',
          lineTotal: item.lineTotal !== undefined && item.lineTotal !== null ? this.toDecimalString(item.lineTotal) : '0.00',
        }

        const result = await this.create(
          billItemPayload,
          userId,
          organizationId
        )

        if (result.success && result.data) {
          createdItems.push(result.data)
        }
      }

      return {
        success: true,
        data: createdItems,
      }
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  /**
   * Helper to convert numeric amounts to decimal strings
   */
  protected toDecimalString(value: string | number): string {
    return typeof value === 'string' ? value : value.toFixed(2)
  }
}
