/**
 * Firestore Validators
 * Generic validation helpers for Firestore operations
 * NO business validation - only infrastructure/data type validation
 */

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate document ID format
 * 
 * Usage:
 *   if (!validateDocumentId(id)) throw new Error('Invalid ID')
 */
export function validateDocumentId(id: any): boolean {
  if (typeof id !== 'string') return false
  if (id.length === 0 || id.length > 1500) return false
  if (id.startsWith('__') || id.startsWith('.')) return false
  return true
}

/**
 * Validate collection name format
 * 
 * Usage:
 *   if (!validateCollectionName(name)) throw new Error('Invalid collection')
 */
export function validateCollectionName(name: any): boolean {
  if (typeof name !== 'string') return false
  if (name.length === 0 || name.length > 64) return false
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) return false
  if (name.startsWith('_') || name.startsWith('-')) return false
  return true
}

/**
 * Validate organization ID
 * Organization ID must be non-empty string
 */
export function validateOrganizationId(orgId: any): boolean {
  return typeof orgId === 'string' && orgId.length > 0 && validateDocumentId(orgId)
}

/**
 * Validate user ID (Firebase Auth UID)
 * Typically 28 characters long
 */
export function validateUserId(userId: any): boolean {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 128
}

/**
 * Validate field name
 * Fields must be camelCase and not start with underscore
 */
export function validateFieldName(name: any): boolean {
  if (typeof name !== 'string') return false
  if (name.length === 0 || name.length > 1500) return false
  if (name.startsWith('_') || name.startsWith('.')) return false
  return /^[a-zA-Z0-9_.]+$/.test(name)
}

/**
 * Validate timestamp (must be Date or null)
 */
export function validateTimestamp(value: any): boolean {
  return value === null || value instanceof Date || value?.constructor?.name === 'Timestamp'
}

/**
 * Validate numeric value (for money fields)
 * Can be number, string (numeric), or Firestore Numeric
 */
export function validateNumericValue(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return !isNaN(parseFloat(value))
  if (value?.type === 'double' && typeof value?.value === 'string') return true
  return false
}

/**
 * Validate pagination options
 */
export function validatePaginationOptions(options: any): ValidationResult {
  const errors: string[] = []

  if (options === undefined) return { valid: true, errors: [] }
  if (typeof options !== 'object') {
    errors.push('Pagination options must be an object')
    return { valid: false, errors }
  }

  if (options.pageSize !== undefined) {
    if (typeof options.pageSize !== 'number' || options.pageSize < 1 || options.pageSize > 1000) {
      errors.push('pageSize must be between 1 and 1000')
    }
  }

  if (options.pageNumber !== undefined) {
    if (typeof options.pageNumber !== 'number' || options.pageNumber < 1) {
      errors.push('pageNumber must be >= 1')
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate query filter
 */
export function validateQueryFilter(filter: any): ValidationResult {
  const errors: string[] = []

  if (!filter || typeof filter !== 'object') {
    errors.push('Filter must be an object')
    return { valid: false, errors }
  }

  if (!validateFieldName(filter.field)) {
    errors.push('Invalid field name in filter')
  }

  const validOperators = ['==', '!=', '<', '<=', '>', '>=', 'array-contains', 'in', 'array-contains-any']
  if (!validOperators.includes(filter.operator)) {
    errors.push(`Invalid operator. Must be one of: ${validOperators.join(', ')}`)
  }

  if (filter.value === undefined) {
    errors.push('Filter value is required')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate query order
 */
export function validateQueryOrder(order: any): ValidationResult {
  const errors: string[] = []

  if (!order || typeof order !== 'object') {
    errors.push('Order must be an object')
    return { valid: false, errors }
  }

  if (!validateFieldName(order.field)) {
    errors.push('Invalid field name in order')
  }

  if (!['asc', 'desc'].includes(order.direction)) {
    errors.push('Order direction must be "asc" or "desc"')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate query options
 */
export function validateQueryOptions(options: any): ValidationResult {
  const errors: string[] = []

  if (options === undefined) return { valid: true, errors: [] }
  if (typeof options !== 'object') {
    errors.push('Query options must be an object')
    return { valid: false, errors }
  }

  if (options.filters !== undefined) {
    if (!Array.isArray(options.filters)) {
      errors.push('Filters must be an array')
    } else {
      for (let i = 0; i < options.filters.length; i++) {
        const result = validateQueryFilter(options.filters[i])
        if (!result.valid) {
          errors.push(`Filter ${i}: ${result.errors.join(', ')}`)
        }
      }
    }
  }

  if (options.orders !== undefined) {
    if (!Array.isArray(options.orders)) {
      errors.push('Orders must be an array')
    } else {
      for (let i = 0; i < options.orders.length; i++) {
        const result = validateQueryOrder(options.orders[i])
        if (!result.valid) {
          errors.push(`Order ${i}: ${result.errors.join(', ')}`)
        }
      }
    }
  }

  if (options.limit !== undefined) {
    if (typeof options.limit !== 'number' || options.limit < 1 || options.limit > 100000) {
      errors.push('Limit must be between 1 and 100000')
    }
  }

  if (options.offset !== undefined) {
    if (typeof options.offset !== 'number' || options.offset < 0) {
      errors.push('Offset must be >= 0')
    }
  }

  if (options.startAfter !== undefined && typeof options.startAfter !== 'object') {
    errors.push('startAfter must be a DocumentSnapshot')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate email format
 */
export function validateEmail(email: any): boolean {
  if (typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (basic check)
 * Accepts various formats with digits and common separators
 */
export function validatePhone(phone: any): boolean {
  if (typeof phone !== 'string') return false
  const phoneRegex = /^[\d\s+\-()]+$/ // Digits, spaces, +, -, parentheses
  if (!phoneRegex.test(phone)) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

/**
 * Validate URL format
 */
export function validateUrl(url: any): boolean {
  if (typeof url !== 'string') return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate enum value
 */
export function validateEnumValue<T extends Record<string, any>>(value: any, enumObj: T): boolean {
  return Object.values(enumObj).includes(value)
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string = 'Field'): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { valid: false, errors: [`${fieldName} is required`] }
  }
  return { valid: true, errors: [] }
}

/**
 * Validate field type
 */
export function validateFieldType(
  value: any,
  expectedType: 'string' | 'number' | 'boolean' | 'object' | 'array',
  fieldName: string = 'Field'
): ValidationResult {
  let actualType: string

  if (value === null) {
    actualType = 'null'
  } else if (Array.isArray(value)) {
    actualType = 'array'
  } else {
    actualType = typeof value
  }

  if (actualType === expectedType) {
    return { valid: true, errors: [] }
  }

  return {
    valid: false,
    errors: [`${fieldName} must be ${expectedType}, got ${actualType}`],
  }
}

/**
 * Validate field length
 */
export function validateFieldLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'Field'
): ValidationResult {
  const errors: string[] = []

  if (value.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`)
  }

  if (value.length > maxLength) {
    errors.push(`${fieldName} must be at most ${maxLength} characters`)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate numeric range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Field'
): ValidationResult {
  const errors: string[] = []

  if (value < min) {
    errors.push(`${fieldName} must be >= ${min}`)
  }

  if (value > max) {
    errors.push(`${fieldName} must be <= ${max}`)
  }

  return { valid: errors.length === 0, errors }
}
