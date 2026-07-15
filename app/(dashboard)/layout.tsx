'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '@/context/AuthContext'

/**
 * Premium Loading Screen
 * Displays while authentication state is being checked and profile is loading
 */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
      <div className="text-center space-y-4">
        <Loader2 className="size-10 animate-spin mx-auto text-primary" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Loading Dashboard</h2>
          <p className="text-sm text-muted-foreground">Initializing your workspace...</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, userProfile, loading, profileLoading } = useAuth()

  useEffect(() => {
    // Redirect to login if not authenticated or profile not loaded
    if (!loading && !user) {
      router.push('/login')
    }
    if (!loading && !profileLoading && user && !userProfile) {
      router.push('/login')
    }
  }, [user, userProfile, loading, profileLoading, router])

  // Show premium loading screen while checking auth
  if (loading || profileLoading) {
    return <AuthLoadingScreen />
  }

  // Don't render dashboard until user and profile are confirmed
  if (!user || !userProfile) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen overflow-x-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

