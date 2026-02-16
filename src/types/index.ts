export type { Database, Phase } from './database'

export interface Nominee {
  name?: string
  film: string
  [key: string]: string | undefined
}

export interface Category {
  name: string
  nominees: Nominee[]
}

export interface NominationsData {
  year: number
  ceremony: string
  ceremonyDate: string
  categories: Category[]
}

export interface Session {
  participantId: string
  roomCode: string
  isHost: boolean
}
