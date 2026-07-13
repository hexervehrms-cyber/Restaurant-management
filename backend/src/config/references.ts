/**
 * Firestore Document Reference Helpers
 * Reusable helpers for creating document references and fetching related documents
 */

import { getFirestore } from './firebase'
import { COLLECTIONS } from './collections'

/**
 * Get reference to organization document
 * 
 * Usage:
 *   const ref = organizationRef(orgId)
 *   const doc = await ref.get()
 */
export function organizationRef(organizationId: string) {
  return getFirestore().collection(COLLECTIONS.organizations).doc(organizationId)
}

/**
 * Get reference to user document
 * 
 * Usage:
 *   const ref = userRef(userId)
 *   const doc = await ref.get()
 */
export function userRef(userId: string) {
  return getFirestore().collection(COLLECTIONS.users).doc(userId)
}

/**
 * Get reference to restaurant document
 * 
 * Usage:
 *   const ref = restaurantRef(restaurantId)
 */
export function restaurantRef(restaurantId: string) {
  return getFirestore().collection(COLLECTIONS.restaurants).doc(restaurantId)
}

/**
 * Get reference to branch document
 * 
 * Usage:
 *   const ref = branchRef(branchId)
 */
export function branchRef(branchId: string) {
  return getFirestore().collection(COLLECTIONS.branches).doc(branchId)
}

/**
 * Get reference to customer document
 * 
 * Usage:
 *   const ref = customerRef(customerId)
 */
export function customerRef(customerId: string) {
  return getFirestore().collection(COLLECTIONS.customers).doc(customerId)
}

/**
 * Get reference to order document
 * 
 * Usage:
 *   const ref = orderRef(orderId)
 */
export function orderRef(orderId: string) {
  return getFirestore().collection(COLLECTIONS.orders).doc(orderId)
}

/**
 * Get reference to bill document
 * 
 * Usage:
 *   const ref = billRef(billId)
 */
export function billRef(billId: string) {
  return getFirestore().collection(COLLECTIONS.bills).doc(billId)
}

/**
 * Get reference to payment document
 * 
 * Usage:
 *   const ref = paymentRef(paymentId)
 */
export function paymentRef(paymentId: string) {
  return getFirestore().collection(COLLECTIONS.payments).doc(paymentId)
}

/**
 * Get reference to table document
 * 
 * Usage:
 *   const ref = tableRef(tableId)
 */
export function tableRef(tableId: string) {
  return getFirestore().collection(COLLECTIONS.tables).doc(tableId)
}

/**
 * Get reference to menu item document
 * 
 * Usage:
 *   const ref = menuItemRef(menuItemId)
 */
export function menuItemRef(menuItemId: string) {
  return getFirestore().collection(COLLECTIONS.menuItems).doc(menuItemId)
}

/**
 * Get reference to kitchen ticket document
 * 
 * Usage:
 *   const ref = kitchenTicketRef(ticketId)
 */
export function kitchenTicketRef(ticketId: string) {
  return getFirestore().collection(COLLECTIONS.kitchenTickets).doc(ticketId)
}

/**
 * Get reference to reservation document
 * 
 * Usage:
 *   const ref = reservationRef(reservationId)
 */
export function reservationRef(reservationId: string) {
  return getFirestore().collection(COLLECTIONS.reservations).doc(reservationId)
}

/**
 * Get reference to inventory item document
 * 
 * Usage:
 *   const ref = inventoryItemRef(itemId)
 */
export function inventoryItemRef(itemId: string) {
  return getFirestore().collection(COLLECTIONS.inventoryItems).doc(itemId)
}

/**
 * Get reference to audit log document
 * 
 * Usage:
 *   const ref = auditLogRef(logId)
 */
export function auditLogRef(logId: string) {
  return getFirestore().collection(COLLECTIONS.auditLogs).doc(logId)
}

/**
 * Get reference to notification document
 * 
 * Usage:
 *   const ref = notificationRef(notificationId)
 */
export function notificationRef(notificationId: string) {
  return getFirestore().collection(COLLECTIONS.notifications).doc(notificationId)
}

/**
 * Fetch organization document
 * 
 * Usage:
 *   const org = await getOrganization(orgId)
 */
export async function getOrganization(organizationId: string) {
  const ref = organizationRef(organizationId)
  const snap = await ref.get()
  return snap.exists ? snap.data() : null
}

/**
 * Fetch user document
 * 
 * Usage:
 *   const user = await getUser(userId)
 */
export async function getUser(userId: string) {
  const ref = userRef(userId)
  const snap = await ref.get()
  return snap.exists ? snap.data() : null
}

/**
 * Fetch restaurant document
 * 
 * Usage:
 *   const restaurant = await getRestaurant(restaurantId)
 */
export async function getRestaurant(restaurantId: string) {
  const ref = restaurantRef(restaurantId)
  const snap = await ref.get()
  return snap.exists ? snap.data() : null
}

/**
 * Fetch branch document
 * 
 * Usage:
 *   const branch = await getBranch(branchId)
 */
export async function getBranch(branchId: string) {
  const ref = branchRef(branchId)
  const snap = await ref.get()
  return snap.exists ? snap.data() : null
}

/**
 * Fetch customer document
 * 
 * Usage:
 *   const customer = await getCustomer(customerId)
 */
export async function getCustomer(customerId: string) {
  const ref = customerRef(customerId)
  const snap = await ref.get()
  return snap.exists ? snap.data() : null
}

/**
 * Fetch order document
 * 
 * Usage:
 *   const order = await getOrder(orderId)
 */
export async function getOrder(orderId: string) {
  const ref = orderRef(orderId)
  const snap = await ref.get()
  return snap.exists ? snap.data() : null
}

/**
 * Fetch bill document
 * 
 * Usage:
 *   const bill = await getBill(billId)
 */
export async function getBill(billId: string) {
  const ref = billRef(billId)
  const snap = await ref.get()
  return snap.exists ? snap.data() : null
}

/**
 * Batch fetch multiple documents by IDs
 * 
 * Usage:
 *   const orders = await batchGetDocuments(COLLECTIONS.orders, [id1, id2, id3])
 */
export async function batchGetDocuments(
  collectionName: string,
  documentIds: string[]
) {
  const db = getFirestore()
  const collection = db.collection(collectionName)

  const docs: any[] = []
  const batch = db.batch()

  // Load in batches to avoid hitting limits
  for (const id of documentIds) {
    const ref = collection.doc(id)
    const snap = await ref.get()
    if (snap.exists) {
      docs.push({ id: snap.id, ...snap.data() })
    }
  }

  return docs
}

/**
 * Check if document exists
 * 
 * Usage:
 *   const exists = await documentExists(COLLECTIONS.customers, customerId)
 */
export async function documentExists(
  collectionName: string,
  documentId: string
): Promise<boolean> {
  const db = getFirestore()
  const snap = await db.collection(collectionName).doc(documentId).get()
  return snap.exists
}

/**
 * Get document ID from reference
 * 
 * Usage:
 *   const id = getDocId(ref)
 */
export function getDocId(docRef: any): string {
  return docRef.id
}

/**
 * Get collection name from reference
 * 
 * Usage:
 *   const name = getCollectionName(ref)
 */
export function getCollectionName(docRef: any): string {
  return docRef.parent.id
}
