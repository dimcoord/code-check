'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserAndProfile } from '@/lib/auth-helpers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { Profile } from '@/types/database'

export interface CreateStudentInput {
  email: string
  full_name: string
  nim: string
  password?: string
  class_id?: string
}

export interface UpdateStudentInput {
  id: string
  full_name: string
  nim: string
  email: string
  class_id?: string
  new_password?: string
}

export async function getStudentsAction(classId?: string) {
  const { user, isStaff } = await getCurrentUserAndProfile()
  if (!user || !isStaff) {
    throw new Error('Hanya dosen atau asisten yang dapat mengakses data mahasiswa.')
  }

  const supabase = createClient()

  if (classId && classId !== 'all') {
    const { data: enrollments, error } = await supabase
      .from('class_enrollments')
      .select('user_id, role, classes(id, name, class_code), profiles(*)')
      .eq('class_id', classId)
      .eq('role', 'student')

    if (error) throw error

    return (enrollments ?? []).map((e: any) => ({
      ...e.profiles,
      class_enrollment: {
        class_id: e.classes?.id,
        class_name: e.classes?.name,
        class_code: e.classes?.class_code,
      },
    }))
  }

  // Get all students
  const { data: students, error } = await supabase
    .from('profiles')
    .select('*, class_enrollments(class_id, role, classes(id, name, class_code))')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  if (error) throw error

  return (students ?? []).map((s: any) => {
    const primaryEnrollment = s.class_enrollments?.[0]
    return {
      ...s,
      class_enrollment: primaryEnrollment
        ? {
            class_id: primaryEnrollment.classes?.id,
            class_name: primaryEnrollment.classes?.name,
            class_code: primaryEnrollment.classes?.class_code,
          }
        : null,
    }
  })
}

export async function createStudentAction(input: CreateStudentInput) {
  const { user, isStaff } = await getCurrentUserAndProfile()
  if (!user || !isStaff) {
    throw new Error('Hanya dosen atau asisten yang dapat membuat akun mahasiswa.')
  }

  const cleanEmail = input.email.trim().toLowerCase()
  const cleanName = input.full_name.trim()
  const cleanNim = input.nim.trim()
  const password = input.password?.trim() || `Mhs#${cleanNim || '123456'}`

  if (!cleanEmail || !cleanName || !cleanNim) {
    throw new Error('Email universitas, nama lengkap, dan NIM wajib diisi.')
  }

  const adminClient = createAdminClient()
  const supabase = createClient()
  let studentUserId = ''

  if (adminClient) {
    // 1. Create auth user directly with confirmed email so the student can immediately log in
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        nim: cleanNim,
        university_email: cleanEmail,
        role: 'student',
      },
    })

    if (authError) {
      // If user already exists in Auth, fetch their ID
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        const { data: existingUser } = await adminClient
          .from('profiles')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle()

        if (existingUser) {
          studentUserId = existingUser.id
        } else {
          throw new Error(`Akun dengan email ${cleanEmail} sudah ada di Auth.`)
        }
      } else {
        throw new Error(`Gagal membuat akun auth: ${authError.message}`)
      }
    } else if (authData.user) {
      studentUserId = authData.user.id
    }
  }

  // 2. Ensure profile exists and has role='student'
  if (studentUserId) {
    const { error: profileError } = await (adminClient || supabase)
      .from('profiles')
      .upsert({
        id: studentUserId,
        email: cleanEmail,
        university_email: cleanEmail,
        full_name: cleanName,
        nim: cleanNim,
        role: 'student',
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Profile upsert warning:', profileError)
    }

    // 3. Enroll into class if specified
    if (input.class_id) {
      await (adminClient || supabase)
        .from('class_enrollments')
        .upsert({
          user_id: studentUserId,
          class_id: input.class_id,
          role: 'student',
        })
    }
  } else {
    throw new Error('Konfigurasi Supabase Admin belum tersedia untuk membuat user baru.')
  }

  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/profile')

  return {
    success: true,
    email: cleanEmail,
    password,
    studentId: studentUserId,
  }
}

export async function updateStudentAction(input: UpdateStudentInput) {
  const { user, isStaff } = await getCurrentUserAndProfile()
  if (!user || !isStaff) {
    throw new Error('Hanya dosen atau asisten yang dapat mengubah data mahasiswa.')
  }

  const supabase = createClient()
  const adminClient = createAdminClient()

  const cleanEmail = input.email.trim().toLowerCase()
  const cleanName = input.full_name.trim()
  const cleanNim = input.nim.trim()

  // Update profile
  const { error: profileError } = await (adminClient || supabase)
    .from('profiles')
    .update({
      email: cleanEmail,
      university_email: cleanEmail,
      full_name: cleanName,
      nim: cleanNim,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (profileError) {
    throw new Error(`Gagal memperbarui profil mahasiswa: ${profileError.message}`)
  }

  // Update password if requested and admin client available
  if (adminClient && input.new_password?.trim()) {
    await adminClient.auth.admin.updateUserById(input.id, {
      password: input.new_password.trim(),
      email: cleanEmail,
    })
  }

  // Update class enrollment if changed
  if (input.class_id) {
    // Remove existing enrollment for student
    await (adminClient || supabase)
      .from('class_enrollments')
      .delete()
      .eq('user_id', input.id)
      .eq('role', 'student')

    // Add new enrollment
    await (adminClient || supabase)
      .from('class_enrollments')
      .insert({
        user_id: input.id,
        class_id: input.class_id,
        role: 'student',
      })
  }

  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/profile')

  return { success: true }
}

export async function deleteStudentAction({ id, classId }: { id: string; classId?: string }) {
  const { user, isStaff } = await getCurrentUserAndProfile()
  if (!user || !isStaff) {
    throw new Error('Hanya dosen atau asisten yang dapat menghapus mahasiswa.')
  }

  const adminClient = createAdminClient()
  const supabase = createClient()

  if (classId) {
    // Just remove from class
    const { error } = await (adminClient || supabase)
      .from('class_enrollments')
      .delete()
      .eq('user_id', id)
      .eq('class_id', classId)

    if (error) throw error
  } else {
    // Full removal
    await (adminClient || supabase)
      .from('class_enrollments')
      .delete()
      .eq('user_id', id)

    await (adminClient || supabase)
      .from('submissions')
      .delete()
      .eq('user_id', id)

    await (adminClient || supabase)
      .from('profiles')
      .delete()
      .eq('id', id)

    if (adminClient) {
      try {
        await adminClient.auth.admin.deleteUser(id)
      } catch (err) {
        console.warn('Could not delete auth user:', err)
      }
    }
  }

  revalidatePath('/dashboard/students')
  revalidatePath('/dashboard/profile')

  return { success: true }
}
