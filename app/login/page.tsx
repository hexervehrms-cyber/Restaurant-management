/**
 * Login Page
 * Premium enterprise-grade Email and Password authentication
 * Features: Remember Me, Forgot Password, session persistence, responsive design
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { ForgotPasswordDialog } from '@/components/auth/forgot-password-dialog'

export default function LoginPage() {
  const router = useRouter()
  const { user, userProfile, loading, profileLoading, error, login } = useAuth()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Redirect to dashboard if already logged in with valid profile
  useEffect(() => {
    if (user && userProfile && !loading && !profileLoading) {
      router.push('/')
    }
  }, [user, userProfile, loading, profileLoading, router])

  /**
   * Validate email format
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Handle login form submission
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setResetSent(false)

    // Validation
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setLocalError('Email is required')
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setLocalError('Please enter a valid email address')
      return
    }

    if (!password) {
      setLocalError('Password is required')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      await login(trimmedEmail, password, rememberMe)
      // Redirect happens via useEffect when userProfile is loaded
    } catch (err: any) {
      setLocalError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle forgot password success
   */
  const handleForgotPasswordSuccess = () => {
    setResetSent(true)
    setShowForgotPassword(false)
    setTimeout(() => setResetSent(false), 5000)
  }

  /**
   * Populate demo credentials (development only)
   */
  const handleUseDemoCredentials = () => {
    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'tester@example.com'
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'demo123456'
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  // Loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Main Login Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-3 pb-6">
            {/* Logo / Brand */}
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                R
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">RestaurantOS</h1>
                <p className="text-xs text-muted-foreground">Enterprise Management System</p>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-1 pt-2">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>Sign in to your restaurant management account</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || profileLoading}
                  className="h-10"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:text-primary/90 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || profileLoading}
                    className="h-10 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    disabled={isLoading || profileLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isLoading || profileLoading}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm font-medium text-foreground cursor-pointer select-none"
                >
                  Keep me signed in
                </label>
              </div>

              {/* Error Message */}
              {(localError || error) && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2 items-start">
                  <AlertCircle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">
                    {localError || error}
                  </p>
                </div>
              )}

              {/* Success Message */}
              {resetSent && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2 items-start dark:bg-green-950/30 dark:border-green-900">
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    Password reset email sent successfully. Check your inbox.
                  </p>
                </div>
              )}

              {/* Profile Loading State */}
              {profileLoading && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2 items-center dark:bg-blue-950/30 dark:border-blue-900">
                  <Loader2 className="size-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    Loading your profile...
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 font-semibold"
                disabled={isLoading || profileLoading}
              >
                {isLoading || profileLoading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials Card (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 pt-6 border-t border-muted">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Demo Credentials
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Testing in development? Use these credentials:
                    </p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-xs font-mono">
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Email: </span>
                      <span>{process.env.NEXT_PUBLIC_DEMO_EMAIL || 'tester@example.com'}</span>
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Password: </span>
                      <span>••••••••</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={handleUseDemoCredentials}
                    disabled={isLoading || profileLoading}
                  >
                    Use Demo Credentials
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-2">
          <p>© {new Date().getFullYear()} RestaurantOS. All rights reserved.</p>
          <p>Enterprise-grade restaurant management system</p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        onSuccess={handleForgotPasswordSuccess}
      />
    </div>
  )
}
