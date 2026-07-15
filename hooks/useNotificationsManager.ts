/**
 * useNotificationsManager Hook
 * Manages local notification state with mark as read, delete, and clear all functionality
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useNotifications } from './useNotifications'
import type { Notification } from '@/types/notifications'

interface UseNotificationsManagerReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: Error | null
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

export function useNotificationsManager(
  limit: number = 10
): UseNotificationsManagerReturn {
  const { data: initialNotifications, loading, error } = useNotifications(limit)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Initialize with fetched data
  useEffect(() => {
    if (initialNotifications) {
      setNotifications(initialNotifications)
    }
  }, [initialNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  }
}
