export type Phase = 'VOTING' | 'LIVE' | 'CLOSED'

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          code: string
          host_id: string
          phase: Phase
          current_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          host_id: string
          phase?: Phase
          current_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          host_id?: string
          phase?: Phase
          current_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          room_id: string
          name: string
          is_host: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          is_host?: boolean
          joined_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          is_host?: boolean
          joined_at?: string
        }
      }
      predictions: {
        Row: {
          id: string
          participant_id: string
          room_id: string
          category_id: string
          nominee_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          room_id: string
          category_id: string
          nominee_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          room_id?: string
          category_id?: string
          nominee_id?: string
          updated_at?: string
        }
      }
      winners: {
        Row: {
          id: string
          room_id: string
          category_id: string
          nominee_id: string
          announced_at: string
        }
        Insert: {
          id?: string
          room_id: string
          category_id: string
          nominee_id: string
          announced_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          category_id?: string
          nominee_id?: string
          announced_at?: string
        }
      }
    }
    Functions: {
      generate_room_code: {
        Args: Record<string, never>
        Returns: string
      }
      create_room: {
        Args: { host_name: string }
        Returns: {
          roomId: string
          roomCode: string
          participantId: string
        }
      }
    }
  }
}
