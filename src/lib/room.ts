import { supabase } from './supabase'
import type { Phase } from '@/types'

export interface Room {
  id: string
  code: string
  host_id: string
  phase: Phase
  current_category_id: string | null
  created_at: string
}

export interface Participant {
  id: string
  room_id: string
  name: string
  joined_at: string
}

export interface Prediction {
  id: string
  participant_id: string
  room_id: string
  category_id: string
  nominee_id: string
}

export interface Winner {
  id: string
  room_id: string
  category_id: string
  nominee_id: string
  announced_at: string
}

export interface LeaderboardEntry {
  participant_id: string
  name: string
  predictions_count: number
  score: number
}

// Create a new room (optionally with a custom code)
export async function createRoom(hostName: string, customCode?: string) {
  const params: Record<string, string> = { host_name: hostName }
  if (customCode) {
    params.custom_code = customCode
  }

  const { data, error } = await supabase.rpc('create_room', params)

  if (error) {
    if (error.message.includes('already taken')) {
      throw new Error('That room code is already taken. Try another one.')
    }
    if (error.message.includes('Invalid room code')) {
      throw new Error('Invalid code. Use letters A-Z (no O, I, L) and digits 2-9.')
    }
    throw error
  }

  return data as {
    roomId: string
    roomCode: string
    hostId: string
  }
}

// Join an existing room
export async function joinRoom(roomCode: string, participantName: string) {
  const { data, error } = await supabase.rpc('join_room', {
    room_code: roomCode.toUpperCase(),
    participant_name: participantName
  })

  if (error) {
    if (error.message.includes('Room not found')) {
      throw new Error('Room not found. Check the code and try again.')
    }
    throw error
  }

  return data as {
    roomId: string
    participantId: string
    phase: Phase
    isRejoin: boolean
  }
}

// Get room by code
export async function getRoomByCode(code: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (error) throw error
  return data as Room
}

// Get room by ID
export async function getRoom(roomId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error) throw error
  return data as Room
}

// Get participants in a room
export async function getParticipants(roomId: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data as Participant[]
}

// Get participant by ID
export async function getParticipant(participantId: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .single()

  if (error) throw error
  return data as Participant
}

// Get predictions for a participant
export async function getPredictions(participantId: string) {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('participant_id', participantId)

  if (error) throw error
  return data as Prediction[]
}

// Get all predictions in a room (for host view)
export async function getRoomPredictions(roomId: string) {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('room_id', roomId)

  if (error) throw error
  return data as Prediction[]
}

// Save a prediction (upsert)
export async function savePrediction(
  participantId: string,
  roomId: string,
  categoryId: string,
  nomineeId: string
) {
  const { error } = await supabase
    .from('predictions')
    .upsert(
      {
        participant_id: participantId,
        room_id: roomId,
        category_id: categoryId,
        nominee_id: nomineeId,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'participant_id,category_id'
      }
    )

  if (error) throw error
}

// Get winners for a room
export async function getWinners(roomId: string) {
  const { data, error } = await supabase
    .from('winners')
    .select('*')
    .eq('room_id', roomId)
    .order('announced_at', { ascending: true })

  if (error) throw error
  return data as Winner[]
}

// Declare a winner (host only)
export async function declareWinner(
  roomId: string,
  categoryId: string,
  nomineeId: string
) {
  const { error } = await supabase
    .from('winners')
    .upsert(
      {
        room_id: roomId,
        category_id: categoryId,
        nominee_id: nomineeId
      },
      {
        onConflict: 'room_id,category_id'
      }
    )

  if (error) throw error
}

// Update room phase (host only)
export async function updateRoomPhase(roomId: string, phase: Phase) {
  const { error } = await supabase
    .from('rooms')
    .update({ phase, updated_at: new Date().toISOString() })
    .eq('id', roomId)

  if (error) throw error
}

// Set current category (host only)
export async function setCurrentCategory(roomId: string, categoryId: string | null) {
  const { error } = await supabase
    .from('rooms')
    .update({ current_category_id: categoryId, updated_at: new Date().toISOString() })
    .eq('id', roomId)

  if (error) throw error
}

// Get leaderboard
export async function getLeaderboard(roomId: string) {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    target_room_id: roomId
  })

  if (error) throw error
  return data as LeaderboardEntry[]
}

// Subscribe to room changes
export function subscribeToRoom(
  roomId: string,
  onRoomChange: (room: Room) => void
) {
  return supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`
      },
      (payload) => {
        if (payload.new) {
          onRoomChange(payload.new as Room)
        }
      }
    )
    .subscribe()
}

// Subscribe to participants changes
export function subscribeToParticipants(
  roomId: string,
  onParticipantsChange: (participants: Participant[]) => void
) {
  // Initial fetch + subscribe
  const fetchAndNotify = async () => {
    const participants = await getParticipants(roomId)
    onParticipantsChange(participants)
  }

  const channel = supabase
    .channel(`participants:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `room_id=eq.${roomId}`
      },
      () => {
        fetchAndNotify()
      }
    )
    .subscribe()

  fetchAndNotify()
  return channel
}

// Subscribe to predictions changes
export function subscribeToPredictions(
  roomId: string,
  onPredictionsChange: (predictions: Prediction[]) => void
) {
  const fetchAndNotify = async () => {
    const predictions = await getRoomPredictions(roomId)
    onPredictionsChange(predictions)
  }

  const channel = supabase
    .channel(`predictions:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'predictions',
        filter: `room_id=eq.${roomId}`
      },
      () => {
        fetchAndNotify()
      }
    )
    .subscribe()

  fetchAndNotify()
  return channel
}

// Subscribe to winners changes
export function subscribeToWinners(
  roomId: string,
  onWinnersChange: (winners: Winner[]) => void
) {
  const fetchAndNotify = async () => {
    const winners = await getWinners(roomId)
    onWinnersChange(winners)
  }

  const channel = supabase
    .channel(`winners:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'winners',
        filter: `room_id=eq.${roomId}`
      },
      () => {
        fetchAndNotify()
      }
    )
    .subscribe()

  fetchAndNotify()
  return channel
}
