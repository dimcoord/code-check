'use server'

import { submitCodeAction } from './submission-actions'

export async function submitCode(code: string, language: string, problem: string, assignmentId?: string, fileName?: string) {
  const result = await submitCodeAction({
    code,
    language,
    problem,
    assignment_id: assignmentId,
    file_name: fileName,
  })

  return result.submission
}
