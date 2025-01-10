import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Database = {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: string
          user_id: string
          problem: string
          language: string
          code: string
          status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error'
          runtime: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          problem: string
          language: string
          code: string
          status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error'
          runtime: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          bio: string
          avatar_url: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          bio?: string
          avatar_url?: string
          updated_at?: string
        }
      }
    }
  }
}

