'use server'

import type { Judge0ExecutionResult } from '@/types/database'

type ParsedResponse<T> = {
  data: T
  raw: string
}

export async function getJudge0BaseUrl() {
  const apiUrl =
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_JUDGE0_URL?.trim() ||
    'http://localhost:2358'

  return apiUrl.replace(/\/+$/, '')
}

function getJudge0Headers(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (process.env.JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY
    headers['X-RapidAPI-Host'] = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com'
  } else if (process.env.RAPIDAPI_KEY) {
    headers['X-RapidAPI-Key'] = process.env.RAPIDAPI_KEY
    headers['X-RapidAPI-Host'] = process.env.RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com'
  }

  if (process.env.JUDGE0_AUTH_TOKEN) {
    headers['X-Auth-Token'] = process.env.JUDGE0_AUTH_TOKEN
  }

  return headers
}

export async function parseJsonResponse<T>(response: Response, context: string): Promise<ParsedResponse<T>> {
  const raw = await response.text()

  if (!raw) {
    throw new Error(`${context} returned an empty response body (status ${response.status})`)
  }

  try {
    return {
      data: JSON.parse(raw) as T,
      raw,
    }
  } catch {
    throw new Error(`${context} returned invalid JSON (status ${response.status}): ${raw.slice(0, 200)}`)
  }
}

export interface ExecuteCodeParams {
  source_code: string
  language_id: number | string
  stdin?: string
  expected_output?: string
}

export async function executeCodeOnJudge0({
  source_code,
  language_id,
  stdin = '',
  expected_output = '',
}: ExecuteCodeParams): Promise<Judge0ExecutionResult> {
  const baseUrl = await getJudge0BaseUrl()
  const headers = getJudge0Headers()

  const payload: Record<string, unknown> = {
    source_code,
    language_id: Number(language_id),
    stdin: stdin || undefined,
    expected_output: expected_output || undefined,
  }

  try {
    // Attempt wait=true first for fast synchronous execution
    const submitRes = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (submitRes.ok) {
      const { data } = await parseJsonResponse<Judge0ExecutionResult>(submitRes, 'Judge0 submission')
      if (data.status) {
        return data
      }
      if (data.token) {
        return await pollJudge0Result(baseUrl, headers, data.token)
      }
    }

    // Fallback to async submission (wait=false)
    const asyncRes = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!asyncRes.ok) {
      const err = await asyncRes.text()
      throw new Error(`Judge0 submit failed (${asyncRes.status}): ${err.slice(0, 200)}`)
    }

    const { data: asyncData } = await parseJsonResponse<{ token?: string }>(asyncRes, 'Judge0 async submit')
    if (!asyncData.token) {
      throw new Error('Judge0 did not return a submission token')
    }

    return await pollJudge0Result(baseUrl, headers, asyncData.token)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown execution error'
    return {
      status: { id: 13, description: 'Internal Error / Runner Unavailable' },
      stderr: message,
      stdout: null,
      compile_output: null,
      time: '0',
      memory: 0,
    }
  }
}

async function pollJudge0Result(
  baseUrl: string,
  headers: Record<string, string>,
  token: string
): Promise<Judge0ExecutionResult> {
  // Poll up to 8 times with exponential backoff
  for (let attempt = 0; attempt < 8; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 800 + attempt * 400))

    const res = await fetch(`${baseUrl}/submissions/${token}?base64_encoded=false`, {
      headers,
      cache: 'no-store',
    })

    if (!res.ok) continue

    const { data } = await parseJsonResponse<Judge0ExecutionResult>(res, 'Judge0 poll')
    // Status IDs: 1 = In Queue, 2 = Processing
    if (data.status && data.status.id > 2) {
      return data
    }
  }

  // Return last polled state or in-queue state
  return {
    token,
    status: { id: 2, description: 'Processing' },
    time: '0',
    memory: 0,
  }
}