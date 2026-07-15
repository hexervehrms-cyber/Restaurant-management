/**
 * Auth Context
 * Manages authentication state and provides auth functions to components
 * Handles Firebase authentication with Firestore user profile lookup
 * Supports Remember Me functionality with Firebase persistence APIs
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  organizationId: string
  restaurantId: string
  branchId: string
}

export interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  profileLoading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch user profile from Firestore
   * Validates required fields and handles missing profiles gracefully
   * Tries multiple lookup strategies:
   * 1. By email (exact match)
   * 2. By Firebase UID
   */
  const fetchUserProfile = async (firebaseUser: User) => {
    setProfileLoading(true)
    try {
      const usersRef = collection(db, 'users')
      
      // Try to find user by email first
      let querySnapshot = await getDocs(query(usersRef, where('email', '==', firebaseUser.email)))

      // If not found by email, try by Firebase UID (if stored in Firestore)
      if (querySnapshot.empty && firebaseUser.uid) {
        console.log(`User not found by email (${firebaseUser.email}), trying by Firebase UID...`)
        querySnapshot = await getDocs(query(usersRef, where('firebaseUid', '==', firebaseUser.uid)))
      }

      if (querySnapshot.empty) {
        console.error(`User profile not found for email: ${firebaseUser.email} or UID: ${firebaseUser.uid}`)
        setError('User profile not found.')
        setUserProfile(null)
        return
      }

      const userDoc = querySnapshot.docs[0]
      const profileData = userDoc.data()

      // Validate required fields
      if (
        !profileData.organizationId ||
        !profileData.restaurantId ||
        !profileData.branchId ||
        !profileData.role ||
        !profileData.status
      ) {
        console.warn('User profile incomplete:', {
          organizationId: profileData.organizationId,
          restaurantId: profileData.restaurantId,
          branchId: profileData.branchId,
          role: profileData.role,
          status: profileData.status,
        })
        setError('User profile incomplete.')
        setUserProfile(null)
        return
      }

      const profile: UserProfile = {
        id: userDoc.id,
        email: profileData.email,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        role: profileData.role,
        status: profileData.status,
        organizationId: profileData.organizationId,
        restaurantId: profileData.restaurantId,
        branchId: profileData.branchId,
      }

      console.log('User profile loaded successfully:', profile)
      setUserProfile(profile)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching user profile:', err)
      setError('Failed to load user profile.')
      setUserProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  /**
   * Subscribe to auth state changes
   * Initializes persistence and loads user profile
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        await fetchUserProfile(currentUser)
      } else {
        setUser(null)
        setUserProfile(null)
        setError(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  /**
   * Login with email and password
   * Handles Remember Me via Firebase persistence APIs
   *
   * @param email - User email address (will be lowercased)
   * @param password - User password
   * @param rememberMe - If true, use LOCAL persistence; if false, use SESSION persistence
   */
  const login = async (email: string, password: string, rememberMe: boolean) => {
    setError(null)
    try {
      // Set persistence based on Remember Me
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistence)

      // Attempt login with validated credentials
      await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password)
      // Profile fetch happens via onAuthStateChanged
    } catch (err: any) {
      let errorMessage = 'Login failed'

      if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'Email not found'
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Try again later.'
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password'
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * Logout current user
   * Signs out from Firebase and clears profile data
   */
  const logout = async () => {
    try {
      await firebaseSignOut(auth)
      setUserProfile(null)
      setError(null)
    } catch (err) {
      console.error('Error signing out:', err)
      setError('Failed to sign out')
      throw err
    }
  }

  /**
   * Send password reset email
   * Uses Firebase sendPasswordResetEmail to securely reset password
   *
   * @param email - User email address to send reset link to
   */
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.toLowerCase().trim())
      // Success is handled by caller showing a message
    } catch (err: any) {
      let errorMessage = 'Failed to send reset email'

      if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    profileLoading,
    error,
    isAuthenticated: !!user && !!userProfile,
    login,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
