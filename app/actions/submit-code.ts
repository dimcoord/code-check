'use server'

import { createClient } from "@/utils/supabase/server"
import { getJudge0BaseUrl, parseJsonResponse } from "./judge0"

export async function submitCode(code: string, language: string, problem: string) {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const baseUrl = getJudge0BaseUrl()

  const submit = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=false`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source_code: code,
      language_id: Number(language),
    })
  })

  if (!submit.ok) {
    const errorBody = await submit.text()
    throw new Error(`Judge0 submit failed (${submit.status}): ${errorBody.slice(0, 200)}`)
  }

  const { data: getToken } = await parseJsonResponse<{ token?: string }>(submit, 'Judge0 submit')
  const token = getToken.token

  if (!token) {
    throw new Error('Judge0 submit did not return a token')
  }

  console.log(token)
  
  const response = await fetch(`${baseUrl}/submissions/${token}?base64_encoded=false`)

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Judge0 result lookup failed (${response.status}): ${errorBody.slice(0, 200)}`)
  }

  const { data: res } = await parseJsonResponse<{ status?: { description?: string }, time?: string }>(response, 'Judge0 result lookup')
  const status = res.status?.description ?? 'Unknown'
  const runtime = `${res.time ?? '0'} ms`

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      user_id: session.user.id,
      code,
      language,
      problem,
      status,
      runtime,
      token
    })
    .select()
    .single()

  if (error) throw error
  return data
}

