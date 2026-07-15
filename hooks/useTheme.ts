/**
 * useTheme Hook
 * Manages theme state with localStorage persistence
 * Supports: light, dark, system
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useUIStore } from '@/lib/store'

export function useTheme() {
  const { theme, setTheme } = useUIStore()

  // Apply theme to DOM
  const applyTheme = useCallback((themeValue: 'dark' | 'light' | 'system') => {
    const root = document.documentElement

    if (themeValue === 'system') {
      // Check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    } else if (themeValue === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }, [])

  // Initialize theme on mount
  useEffect(() => {
    // Apply the stored theme
    applyTheme(theme)
  }, [theme, applyTheme])

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      applyTheme('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, applyTheme])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const setDarkTheme = useCallback(() => {
    setTheme('dark')
  }, [setTheme])

  const setLightTheme = useCallback(() => {
    setTheme('light')
  }, [setTheme])

  const setSystemTheme = useCallback(() => {
    setTheme('system')
  }, [setTheme])

  return {
    theme,
    toggleTheme,
    setTheme,
    setDarkTheme,
    setLightTheme,
    setSystemTheme,
  }
}
