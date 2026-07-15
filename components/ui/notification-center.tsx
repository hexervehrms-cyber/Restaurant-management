'use client'

import { Bell, Trash2, Check, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useNotificationsManager } from '@/hooks/useNotificationsManager'

interface NotificationCenterProps {
  limit?: number
}

export function NotificationCenter({ limit = 10 }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationsManager(limit)

  const [isOpen, setIsOpen] = useState(false)
  const [animate, setAnimate] = useState(false)

  const readNotifications = notifications.filter((n) => n.read)
  const unreadNotifications = notifications.filter((n) => !n.read)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return '📦'
      case 'alert':
        return '⚠️'
      case 'reservation':
        return '📅'
      case 'success':
        return '✅'
      default:
        return '📝'
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setAnimate(true)
      setTimeout(() => setAnimate(false), 300)
    }
  }

  return (
    <>
      <style>{`
        @keyframes bell-swing {
          0% {
            transform: rotate(0deg);
            transform-origin: top center;
          }
          10% {
            transform: rotate(-14deg);
            transform-origin: top center;
          }
          20% {
            transform: rotate(14deg);
            transform-origin: top center;
          }
          30% {
            transform: rotate(-11deg);
            transform-origin: top center;
          }
          40% {
            transform: rotate(9deg);
            transform-origin: top center;
          }
          50% {
            transform: rotate(-6deg);
            transform-origin: top center;
          }
          65% {
            transform: rotate(3deg);
            transform-origin: top center;
          }
          80% {
            transform: rotate(-1deg);
            transform-origin: top center;
          }
          100% {
            transform: rotate(0deg);
            transform-origin: top center;
          }
        }
        .bell-swing-animate {
          animation: bell-swing 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .bell-swing-animate {
            animation: none;
          }
        }
      `}</style>

      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger className="relative inline-flex items-center justify-center size-8 rounded-lg transition-all duration-200 hover:bg-muted/70 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Bell className={cn('size-4 transition-transform', animate && 'bell-swing-animate')} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Bell className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Unread Section */}
              {unreadNotifications.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-primary/5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Unread ({unreadNotifications.length})
                    </p>
                  </div>
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors bg-primary/5"
                      role="button"
                      tabIndex={0}
                    >
                      <span className="text-lg shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Read Section */}
              {readNotifications.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">
                      Earlier ({readNotifications.length})
                    </p>
                  </div>
                  {readNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors opacity-75"
                      role="button"
                      tabIndex={0}
                    >
                      <span className="text-lg shrink-0 mt-0.5 opacity-50">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1 text-muted-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center gap-2 px-4 py-2">
              <DropdownMenuItem className="flex-1 cursor-pointer">
                <span className="text-xs">View all notifications</span>
              </DropdownMenuItem>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={clearAll}
                  title="Clear all notifications"
                >
                  <Trash2 className="size-3" />
                  Clear all
                </Button>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
