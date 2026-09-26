'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserAndProfile } from '@/lib/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import type { Assignment, SupportedLanguage } from '@/types/database'

export interface CreateAssignmentInput {
  class_id: string
  title: string
  description: string
  language: SupportedLanguage
  starter_code?: string
  sample_input?: string
  expected_output?: string
  max_score?: number
  due_date?: string
}

export interface UpdateAssignmentInput extends Partial<CreateAssignmentInput> {}

export async function getAssignmentsAction(classId?: string) {
  const { user, profile, isStaff } = await getCurrentUserAndProfile()
  if (!user) throw new Error('Unauthenticated')

  const supabase = createClient()

  let query = supabase
    .from('assignments')
    .select('*, classes(id, name, class_code), submissions(id, user_id, score, status)')
    .order('created_at', { ascending: false })

  if (classId && classId !== 'all') {
    query = query.eq('class_id', classId)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching assignments:', error)
    return []
  }

  return (data ?? []).map((assignment: any) => {
    const subs = assignment.submissions || []
    const mySub = subs.find((s: any) => s.user_id === user.id)

    return {
      id: assignment.id,
      class_id: assignment.class_id,
      title: assignment.title,
      description: assignment.description,
      language: assignment.language,
      starter_code: assignment.starter_code,
      sample_input: assignment.sample_input,
      expected_output: assignment.expected_output,
      max_score: assignment.max_score ?? 100,
      due_date: assignment.due_date,
      created_by: assignment.created_by,
      created_at: assignment.created_at,
      classes: assignment.classes,
      submissions_count: subs.length,
      my_submission: mySub
        ? {
            id: mySub.id,
            status: mySub.status,
            score: mySub.score,
          }
        : null,
    }
  })
}

export async function getAssignmentByIdAction(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assignments')
    .select('*, classes(id, name, class_code)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Assignment
}

export async function createAssignmentAction(input: CreateAssignmentInput) {
  const { user, isStaff } = await getCurrentUserAndProfile()
  if (!user || !isStaff) {
    throw new Error('Hanya dosen atau asisten yang dapat membuat tugas.')
  }

  if (!input.title?.trim() || !input.class_id) {
    throw new Error('Judul tugas dan kelas wajib dipilih.')
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      class_id: input.class_id,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      language: input.language || 'all',
      starter_code: input.starter_code ?? '',
      sample_input: input.sample_input ?? '',
      expected_output: input.expected_output ?? '',
      max_score: input.max_score || 100,
      due_date: input.due_date ? new Date(input.due_date).toISOString() : null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/assignments')
  return data
}

export async function updateAssignmentAction(id: string, input: UpdateAssignmentInput) {
  const { user, isStaff } = await getCurrentUserAndProfile()
  if (!user || !isStaff) {
    throw new Error('Hanya dosen atau asisten yang dapat mengubah tugas.')
  }

  const supabase = createClient()

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.title !== undefined) updatePayload.title = input.title.trim()
  if (input.description !== undefined) updatePayload.description = input.description.trim()
  if (input.class_id !== undefined) updatePayload.class_id = input.class_id
  if (input.language !== undefined) updatePayload.language = input.language
  if (input.starter_code !== undefined) updatePayload.starter_code = input.starter_code
  if (input.sample_input !== undefined) updatePayload.sample_input = input.sample_input
  if (input.expected_output !== undefined) updatePayload.expected_output = input.expected_output
  if (input.max_score !== undefined) updatePayload.max_score = input.max_score
  if (input.due_date !== undefined) {
    updatePayload.due_date = input.due_date ? new Date(input.due_date).toISOString() : null
  }

  const { data, error } = await supabase
    .from('assignments')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/assignments')
  return data
}

export async function deleteAssignmentAction(id: string) {
  const { user, isStaff } = await getCurrentUserAndProfile()
  if (!user || !isStaff) {
    throw new Error('Hanya dosen atau asisten yang dapat menghapus tugas.')
  }

  const supabase = createClient()

  // Submissions will be deleted via CASCADE or manually
  await supabase.from('submissions').delete().eq('assignment_id', id)

  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/dashboard/assignments')
  return { success: true }
}
