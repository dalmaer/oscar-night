import { useState, useEffect, useCallback } from 'react'
import { useSession } from './useSession'
import * as roomService from '@/lib/room'
import type { Phase } from '@/types'

export function useRoom(roomCode: string | undefined) {
  const { session } = useSession()

  const [room, setRoom] = useState<roomService.Room | null>(null)
  const [participants, setParticipants] = useState<roomService.Participant[]>([])
  const [predictions, setPredictions] = useState<roomService.Prediction[]>([])
  const [myPredictions, setMyPredictions] = useState<Record<string, string>>({})
  const [winners, setWinners] = useState<roomService.Winner[]>([])
  const [leaderboard, setLeaderboard] = useState<roomService.LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isHost = session?.isHost ?? false
  const participantId = session?.participantId

  // Load room data
  useEffect(() => {
    if (!roomCode) return

    const loadRoom = async () => {
      try {
        setIsLoading(true)
        const roomData = await roomService.getRoomByCode(roomCode)
        setRoom(roomData)

        // Load initial data
        const [participantsData, winnersData] = await Promise.all([
          roomService.getParticipants(roomData.id),
          roomService.getWinners(roomData.id),
        ])

        setParticipants(participantsData)
        setWinners(winnersData)

        // Load predictions if we have a session
        if (participantId) {
          const myPreds = await roomService.getPredictions(participantId)
          const predMap: Record<string, string> = {}
          myPreds.forEach(p => {
            predMap[p.category_id] = p.nominee_id
          })
          setMyPredictions(predMap)
        }

        // Load all predictions for leaderboard
        const allPreds = await roomService.getRoomPredictions(roomData.id)
        setPredictions(allPreds)

        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room')
      } finally {
        setIsLoading(false)
      }
    }

    loadRoom()
  }, [roomCode, participantId])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!room?.id) return

    const roomChannel = roomService.subscribeToRoom(room.id, setRoom)
    const participantsChannel = roomService.subscribeToParticipants(room.id, setParticipants)
    const predictionsChannel = roomService.subscribeToPredictions(room.id, setPredictions)
    const winnersChannel = roomService.subscribeToWinners(room.id, setWinners)

    return () => {
      roomChannel.unsubscribe()
      participantsChannel.unsubscribe()
      predictionsChannel.unsubscribe()
      winnersChannel.unsubscribe()
    }
  }, [room?.id])

  // Update leaderboard when predictions or winners change
  useEffect(() => {
    if (!room?.id) return

    const updateLeaderboard = async () => {
      try {
        const lb = await roomService.getLeaderboard(room.id)
        setLeaderboard(lb)
      } catch (err) {
        console.error('Failed to update leaderboard:', err)
      }
    }

    updateLeaderboard()
  }, [room?.id, predictions, winners])

  // Save prediction
  const savePrediction = useCallback(async (categoryId: string, nomineeId: string) => {
    if (!participantId || !room?.id) return

    // Optimistic update
    setMyPredictions(prev => ({ ...prev, [categoryId]: nomineeId }))

    try {
      await roomService.savePrediction(participantId, room.id, categoryId, nomineeId)
    } catch (err) {
      // Revert on error
      setMyPredictions(prev => {
        const next = { ...prev }
        delete next[categoryId]
        return next
      })
      console.error('Failed to save prediction:', err)
    }
  }, [participantId, room?.id])

  // Start ceremony (host only)
  const startCeremony = useCallback(async () => {
    if (!room?.id || !isHost) return

    try {
      await roomService.updateRoomPhase(room.id, 'LIVE')
    } catch (err) {
      console.error('Failed to start ceremony:', err)
    }
  }, [room?.id, isHost])

  // Declare winner (host only)
  const declareWinner = useCallback(async (categoryId: string, nomineeId: string) => {
    if (!room?.id || !isHost) return

    try {
      await roomService.declareWinner(room.id, categoryId, nomineeId)
    } catch (err) {
      console.error('Failed to declare winner:', err)
    }
  }, [room?.id, isHost])

  // Set current category (host only)
  const setCurrentCategory = useCallback(async (categoryId: string | null) => {
    if (!room?.id || !isHost) return

    try {
      await roomService.setCurrentCategory(room.id, categoryId)
    } catch (err) {
      console.error('Failed to set current category:', err)
    }
  }, [room?.id, isHost])

  // Calculate participant stats
  const participantStats = participants.map(p => {
    const preds = predictions.filter(pred => pred.participant_id === p.id)
    const lb = leaderboard.find(l => l.participant_id === p.id)
    return {
      ...p,
      predictionsCount: preds.length,
      score: lb?.score ?? 0
    }
  })

  // Winners as a map
  const winnersMap: Record<string, string> = {}
  winners.forEach(w => {
    winnersMap[w.category_id] = w.nominee_id
  })

  return {
    room,
    phase: room?.phase as Phase | undefined,
    participants: participantStats,
    predictions: myPredictions,
    allPredictions: predictions,
    winners: winnersMap,
    currentCategory: room?.current_category_id,
    leaderboard,
    isHost,
    isLoading,
    error,
    savePrediction,
    startCeremony,
    declareWinner,
    setCurrentCategory,
  }
}
