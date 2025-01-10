'use server'

import { createClient } from "@/utils/supabase/server";

export async function getUserData(){
    const supabase = await createClient()

    const { data: {user}, error } = await supabase.auth.getUser()
    console.log(user)

    if (error) throw error
    return user
}