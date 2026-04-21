'use server'

import { createClient } from "@/utils/supabase/server"
import { getJudge0BaseUrl, parseJsonResponse } from "./judge0"

export async function updateStatus() {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const submissions = await supabase
    .from('submissions')
    .select("status, token")
    .in("status", ["In Queue", "Processing"])

  if(submissions.data){
    const baseUrl = getJudge0BaseUrl()
    const length = Object.keys(submissions.data).length;
    console.log(length)
    for(let i = 0; i < length; i++){
      let token = submissions.data[i].token
      let response = await fetch(`${baseUrl}/submissions/${token}?base64_encoded=false`)

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Judge0 result lookup failed (${response.status}): ${errorBody.slice(0, 200)}`)
      }

      let res = (await parseJsonResponse<{ status?: { description?: string }, time?: string }>(response, 'Judge0 result lookup')).data
      let status = res.status.description
      let runtime = `${res.time} ms`

      console.log(status, runtime)

      let { data, error } = await supabase
        .from('submissions')
        .update({
          status: status,
          runtime: runtime,
        })
        .eq("token", token)

      if (error) throw error
    }
  }
}