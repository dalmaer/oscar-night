import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'oscarNight'

export interface Session {
  participantId: string
  roomCode: string
  roomId: string
  isHost: boolean
  name: string
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSession(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  // Save session to localStorage
  const saveSession = useCallback((newSession: Session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession))
    setSession(newSession)
  }, [])

  // Clear session
  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  return {
    session,
    isLoading,
    saveSession,
    clearSession,
  }
}
