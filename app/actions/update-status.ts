'use server'

import { createClient } from "@/utils/supabase/server"
import { getJudge0BaseUrl, parseJsonResponse } from "./judge0"

export async function updateStatus() {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return
  }

  const { data: pendingSubmissions } = await supabase
    .from('submissions')
    .select("id, status, token")
    .in("status", ["In Queue", "Processing", "Pending"])
    .not("token", "is", null)
    .limit(10)

  if (!pendingSubmissions || pendingSubmissions.length === 0) {
    return
  }

  const baseUrl = await getJudge0BaseUrl()

  for (const item of pendingSubmissions) {
    if (!item.token) continue
    try {
      const response = await fetch(`${baseUrl}/submissions/${item.token}?base64_encoded=false`, {
        cache: 'no-store',
      })

      if (!response.ok) continue

      const { data: res } = await parseJsonResponse<{
        status?: { description?: string; id?: number }
        time?: string
        memory?: number
        stdout?: string
        stderr?: string
        compile_output?: string
      }>(response, 'Judge0 status check')

      if (res.status?.description) {
        await supabase
          .from('submissions')
          .update({
            status: res.status.description,
            runtime: res.time ? `${res.time}s` : undefined,
            memory: res.memory ? `${res.memory} KB` : undefined,
            stdout: res.stdout ?? null,
            stderr: res.stderr ?? null,
            compile_output: res.compile_output ?? null,
          })
          .eq("id", item.id)
      }
    } catch (err) {
      console.warn(`Failed to update status for token ${item.token}:`, err)
    }
  }
}