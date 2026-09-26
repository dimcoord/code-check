import { createClient } from '@/utils/supabase/server'
import type { Profile, UserRole } from '@/types/database'

export async function getCurrentUserAndProfile() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { user: null, profile: null, isStaff: false, role: 'student' as UserRole }
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    let profile = profileData as Profile | null

    if (!profile) {
      const rawRole = (user.user_metadata?.role as UserRole) || 'student'
      const validRole: UserRole = ['lecturer', 'ta', 'student'].includes(rawRole) ? rawRole : 'student'

      profile = {
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: validRole,
        nim: user.user_metadata?.nim || null,
        university_email: user.user_metadata?.university_email || user.email || null,
        kelas: user.user_metadata?.kelas || null,
        bio: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    const isStaff = profile.role === 'lecturer' || profile.role === 'ta'

    return {
      user,
      profile,
      isStaff,
      role: profile.role,
    }
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err
    }
    return { user: null, profile: null, isStaff: false, role: 'student' as UserRole }
  }
}
