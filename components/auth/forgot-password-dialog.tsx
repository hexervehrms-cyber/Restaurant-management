/**
 * Forgot Password Dialog
 * Allows users to reset their password via Firebase
 * Handles email validation and sends password reset email
 */

'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  onSuccess,
}: ForgotPasswordDialogProps) {
  const { resetPassword } = useAuth()

  // Form state
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  /**
   * Validate email format
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Handle password reset form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Email is required')
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      await resetPassword(trimmedEmail)
      setSuccess(true)
      setEmail('')

      // Call onSuccess and close after delay
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    setEmail('')
    setError('')
    setSuccess(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!success ? (
          <>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="reset-email" className="text-sm font-semibold text-foreground">
                  Email Address
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="admin@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                  className="h-10"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2 items-start">
                  <AlertCircle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Back to Login
                </Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <CheckCircle2 className="size-6 text-green-600 dark:text-green-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Email Sent Successfully</h3>
              <p className="text-sm text-muted-foreground">
                Check your inbox for a password reset link. If you don't see it, check your spam folder.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
