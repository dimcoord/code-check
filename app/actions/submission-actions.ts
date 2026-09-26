'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserAndProfile } from '@/lib/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import { executeCodeOnJudge0 } from './judge0'
import type { Submission } from '@/types/database'

export interface SubmitCodeInput {
  assignment_id?: string
  problem: string
  code: string
  language: string // '76' for C++, '62' for Java
  file_name?: string
  stdin?: string
  expected_output?: string
}

export interface GradeSubmissionInput {
  submission_id: string
  score: number
  feedback?: string
  grading_status?: 'Accepted' | 'Needs Revision' | 'Rejected'
}

export async function submitCodeAction(input: SubmitCodeInput) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  if (!input.code?.trim()) {
    throw new Error('Kode tidak boleh kosong.')
  }

  // 1. If an assignment is specified, fetch its expected test cases if not provided
  let testStdin = input.stdin ?? ''
  let expectedOutput = input.expected_output ?? ''

  if (input.assignment_id && (!testStdin || !expectedOutput)) {
    const { data: assignment } = await supabase
      .from('assignments')
      .select('sample_input, expected_output')
      .eq('id', input.assignment_id)
      .maybeSingle()

    if (assignment) {
      if (!testStdin && assignment.sample_input) testStdin = assignment.sample_input
      if (!expectedOutput && assignment.expected_output) expectedOutput = assignment.expected_output
    }
  }

  // 2. Execute on Judge0
  const result = await executeCodeOnJudge0({
    source_code: input.code,
    language_id: input.language,
    stdin: testStdin,
    expected_output: expectedOutput,
  })

  const statusDesc = result.status?.description ?? 'Unknown'
  const runtime = result.time ? `${result.time}s` : '0s'
  const memory = result.memory ? `${result.memory} KB` : null

  // 3. Save submission into Supabase
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      assignment_id: input.assignment_id || null,
      user_id: user.id,
      problem: input.problem || 'Coding Task',
      language: input.language,
      code: input.code,
      file_name: input.file_name || null,
      status: statusDesc,
      runtime,
      memory,
      stdout: result.stdout ?? null,
      stderr: result.stderr ?? null,
      compile_output: result.compile_output ?? null,
      token: result.token ?? null,
      grading_status: 'Unreviewed',
    })
    .select()
    .single()

  if (error) {
    console.error('Submission database insert error:', error)
    throw new Error(`Gagal menyimpan submisi: ${error.message}`)
  }

  revalidatePath('/dashboard/submissions')
  revalidatePath('/dashboard/assignments')

  return {
    submission: data as Submission,
    execution: result,
  }
}

export async function testRunCodeAction({
  code,
  language,
  stdin = '',
  expected_output = '',
}: {
  code: string
  language: string
  stdin?: string
  expected_output?: string
}) {
  if (!code?.trim()) {
    throw new Error('Kode tidak boleh kosong.')
  }

  return await executeCodeOnJudge0({
    source_code: code,
    language_id: language,
    stdin,
    expected_output,
  })
}

export async function gradeSubmissionAction(input: GradeSubmissionInput) {
  const { user, isStaff } = await getCurrentUserAndProfile()
  if (!user || !isStaff) {
    throw new Error('Hanya dosen atau asisten yang dapat menilai submisi.')
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('submissions')
    .update({
      score: Number(input.score),
      feedback: input.feedback?.trim() || null,
      grading_status: input.grading_status || 'Accepted',
      graded_by: user.id,
      graded_at: new Date().toISOString(),
    })
    .eq('id', input.submission_id)
    .select()
    .single()

  if (error) throw error

  revalidatePath(`/dashboard/submissions/${input.submission_id}`)
  revalidatePath('/dashboard/submissions')

  return data
}
