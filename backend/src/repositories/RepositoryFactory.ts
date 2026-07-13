/**
 * Repository Factory
 * Singleton factory for managing repository instances
 * Provides dependency injection and repository registration
 * 
 * Usage:
 *   RepositoryFactory.register('users', UserRepository)
 *   const userRepo = RepositoryFactory.resolve<UserRepository>('users')
 */

import { BaseDocument, DocumentId } from '../types/firestore'
import { IRepository } from './IRepository'

/**
 * Repository constructor type
 */
type RepositoryConstructor<T extends BaseDocument> = new (collectionName: string) => IRepository<T>

/**
 * Repository instance cache
 */
interface RepositoryInstance {
  collectionName: string
  instance: IRepository<any>
  constructor: RepositoryConstructor<any>
}

/**
 * Repository Factory - Singleton
 * Manages repository instances and provides dependency injection
 */
export class RepositoryFactory {
  /**
   * Map of registered repositories
   * Key: repository name (e.g., 'users', 'orders')
   * Value: repository constructor and instance
   */
  private static repositories: Map<string, RepositoryInstance> = new Map()

  /**
   * Register a repository class
   * 
   * Usage:
   *   RepositoryFactory.register('users', UserRepository)
   *   RepositoryFactory.register('orders', OrderRepository)
   * 
   * @param name - Repository name (e.g., 'users', 'orders')
   * @param constructor - Repository class constructor
   * @param collectionName - Firestore collection name
   * 
   * @throws Error if repository already registered
   */
  static register<T extends BaseDocument>(
    name: string,
    constructor: RepositoryConstructor<T>,
    collectionName: string
  ): void {
    if (this.repositories.has(name)) {
      throw new Error(`Repository '${name}' already registered`)
    }

    // Create instance
    const instance = new constructor(collectionName)

    this.repositories.set(name, {
      collectionName,
      instance,
      constructor,
    })
  }

  /**
   * Resolve a repository instance
   * Returns cached instance or creates new one
   * 
   * Usage:
   *   const userRepo = RepositoryFactory.resolve<UserRepository>('users')
   * 
   * @param name - Repository name
   * @returns Repository instance
   * 
   * @throws Error if repository not registered
   */
  static resolve<T extends IRepository<any>>(name: string): T {
    const repo = this.repositories.get(name)

    if (!repo) {
      throw new Error(
        `Repository '${name}' not registered. Register it first with RepositoryFactory.register()`
      )
    }

    return repo.instance as T
  }

  /**
   * Resolve or create repository
   * If not registered, creates instance with default collection name
   * 
   * Usage:
   *   const userRepo = RepositoryFactory.resolveOrCreate<UserRepository>(
   *     'users',
   *     UserRepository,
   *     'users'
   *   )
   * 
   * @param name - Repository name
   * @param constructor - Repository class constructor
   * @param collectionName - Firestore collection name (for new registrations)
   * @returns Repository instance
   */
  static resolveOrCreate<T extends IRepository<any>>(
    name: string,
    constructor: RepositoryConstructor<any>,
    collectionName: string
  ): T {
    if (!this.repositories.has(name)) {
      this.register(name, constructor, collectionName)
    }

    return this.resolve<T>(name)
  }

  /**
   * Check if repository is registered
   * 
   * Usage:
   *   if (RepositoryFactory.has('users')) {
   *     const userRepo = RepositoryFactory.resolve('users')
   *   }
   * 
   * @param name - Repository name
   * @returns Boolean indicating registration status
   */
  static has(name: string): boolean {
    return this.repositories.has(name)
  }

  /**
   * Get all registered repository names
   * 
   * Usage:
   *   const names = RepositoryFactory.getRegistered()
   *   console.log(names) // ['users', 'orders', 'customers']
   * 
   * @returns Array of registered repository names
   */
  static getRegistered(): string[] {
    return Array.from(this.repositories.keys())
  }

  /**
   * Unregister a repository
   * Removes from cache, allows re-registration
   * 
   * Usage:
   *   RepositoryFactory.unregister('users')
   * 
   * @param name - Repository name
   * @returns Boolean indicating success
   */
  static unregister(name: string): boolean {
    return this.repositories.delete(name)
  }

  /**
   * Clear all repositories
   * Removes all cached instances
   * Useful for testing or resetting factory state
   * 
   * Usage:
   *   RepositoryFactory.clear()
   * 
   * @returns Number of repositories cleared
   */
  static clear(): number {
    const count = this.repositories.size
    this.repositories.clear()
    return count
  }

  /**
   * Reset factory to initial state
   * Alias for clear()
   * 
   * Usage:
   *   RepositoryFactory.reset()
   */
  static reset(): void {
    this.clear()
  }

  /**
   * Get repository information
   * For debugging and inspection
   * 
   * Usage:
   *   const info = RepositoryFactory.getInfo('users')
   *   console.log(info)
   * 
   * @param name - Repository name
   * @returns Repository information object or null
   */
  static getInfo(name: string): { collectionName: string; name: string } | null {
    const repo = this.repositories.get(name)
    if (!repo) return null

    return {
      name,
      collectionName: repo.collectionName,
    }
  }

  /**
   * Get all repository information
   * For debugging and inspection
   * 
   * Usage:
   *   const allInfo = RepositoryFactory.getAllInfo()
   *   console.log(allInfo)
   * 
   * @returns Array of repository information objects
   */
  static getAllInfo(): { name: string; collectionName: string }[] {
    return Array.from(this.repositories.entries()).map(([name, repo]) => ({
      name,
      collectionName: repo.collectionName,
    }))
  }
}
