'use server'

import { createClient } from "@/utils/supabase/server"

export async function submitCode(code: string, language: string, problem: string) {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const submit = await fetch(`${process.env.API_URL}/submissions/?base64_encoded=false&wait=false`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({source_code: code, language_id: Number(language)})
  })

  const getToken = await submit.json()
  const token = getToken.token
  console.log(token)
  
  const response = await fetch(`${process.env.API_URL}/submissions/${token}?base64_encoded=false`)
  const res = await response.json()
  const status = res.status.description
  const runtime = `${res.time} ms`

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

