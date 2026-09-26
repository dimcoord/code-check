export type UserRole = 'lecturer' | 'ta' | 'student'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  nim?: string | null
  university_email?: string | null
  kelas?: string | null
  bio?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface ClassRecord {
  id: string
  name: string
  description?: string | null
  class_code: string
  owner_id: string
  created_at: string
  updated_at?: string
  owner?: Profile | null
  member_count?: number
}

export interface EnrollmentRecord {
  id: string
  user_id: string
  class_id: string
  role: 'owner' | 'assistant' | 'student'
  created_at: string
  classes?: ClassRecord | null
  profiles?: Profile | null
}

export type SupportedLanguage = 'cpp' | 'java' | 'all'

export interface Assignment {
  id: string
  class_id: string
  title: string
  description: string
  language: SupportedLanguage
  starter_code?: string | null
  sample_input?: string | null
  expected_output?: string | null
  max_score: number
  due_date?: string | null
  created_by?: string | null
  created_at: string
  updated_at?: string
  classes?: ClassRecord | null
  creator?: Profile | null
  submissions_count?: number
}

export type SubmissionStatus =
  | 'Pending'
  | 'In Queue'
  | 'Processing'
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Compilation Error'
  | 'Runtime Error'

export type GradingStatus = 'Unreviewed' | 'Accepted' | 'Needs Revision' | 'Rejected'

export interface Submission {
  id: string
  assignment_id?: string | null
  user_id: string
  problem: string
  language: string
  code: string
  file_name?: string | null
  status: SubmissionStatus | string
  runtime?: string | null
  memory?: string | null
  stdout?: string | null
  stderr?: string | null
  compile_output?: string | null
  token?: string | null
  score?: number | null
  feedback?: string | null
  grading_status?: GradingStatus | string | null
  graded_by?: string | null
  graded_at?: string | null
  created_at: string
  profiles?: Profile | null
  assignments?: Assignment | null
  grader?: Profile | null
}

export interface Judge0ExecutionResult {
  stdout?: string | null
  stderr?: string | null
  compile_output?: string | null
  message?: string | null
  time?: string | null
  memory?: number | null
  status?: {
    id: number
    description: string
  }
  token?: string
}
