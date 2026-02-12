'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/auth'

export async function loginAdmin(prevState: any, formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    const supabase = await createClient()

    // Query user by username
    const { data: user, error } = await supabase
        .from('admin_user')
        .select('*')
        .eq('username', username)
        .single()

    if (error || !user) {
        // Return a generic error for security, though we could log the specific error
        return { error: 'Invalid credentials' }
    }

    // Verify password
    const isValid = verifyPassword(password, user.password)

    if (isValid) {
        // Set session
        const cookieStore = await cookies()
        cookieStore.set('admin_session', 'true', {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 // 1 day
        })

        cookieStore.set('admin_name', user.full_name, {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24
        })

        redirect('/admin')
    } else {
        return { error: 'Invalid credentials' }
    }
}

export async function logoutAdmin() {
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')
    cookieStore.delete('admin_name')
    redirect('/controlpanel')
}
