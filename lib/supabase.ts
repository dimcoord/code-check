import { createClient } from '@supabase/supabase-js'
import type { Assignment, ClassRecord, EnrollmentRecord, Profile, Submission } from '@/types/database'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string; email: string }
        Update: Partial<Profile>
      }
      classes: {
        Row: ClassRecord
        Insert: Omit<ClassRecord, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<ClassRecord>
      }
      class_enrollments: {
        Row: EnrollmentRecord
        Insert: Omit<EnrollmentRecord, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<EnrollmentRecord>
      }
      assignments: {
        Row: Assignment
        Insert: Omit<Assignment, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Assignment>
      }
      submissions: {
        Row: Submission
        Insert: Omit<Submission, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Submission>
      }
    }
  }
}
