type ParsedResponse<T> = {
  data: T
  raw: string
}

export function getJudge0BaseUrl() {
  const apiUrl = process.env.API_URL?.trim()

  if (!apiUrl) {
    throw new Error('API_URL is not set')
  }

  return apiUrl.replace(/\/+$/, '')
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