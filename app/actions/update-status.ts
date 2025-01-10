'use server'

import { createClient } from "@/utils/supabase/server"

export async function updateStatus() {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const submissions = await supabase
    .from('submissions')
    .select("status, token")
    .eq("status", "In Queue")

  if(submissions.data){
    const length = Object.keys(submissions.data).length;
    console.log(length)
    for(let i = 0; i < length; i++){
      let token = submissions.data[i].token
      let response = await fetch(`${process.env.API_URL}/submissions/${token}?base64_encoded=false`)
      let res = await response.json()
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
      return data
    }
  }
}