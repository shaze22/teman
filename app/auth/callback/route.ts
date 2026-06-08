import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )

      // Check if user already exists in our users table
      const { data: existing } = await admin
        .from('users')
        .select('id, role')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        // New Google OAuth user create customer account automatically
        const now = new Date().toISOString()
        const fullName = data.user.user_metadata?.full_name ?? data.user.email?.split('@')[0] ?? 'User'
        const email = data.user.email ?? ''

        await admin.from('users').insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'customer',
          status: 'active',
          updated_at: now,
        })

        const profileId = crypto.randomUUID()
        await admin.from('customer_profiles').insert({
          id: profileId,
          user_id: data.user.id,
          is_for_self: true,
          location_state: '',
          location_city: '',
          mobility_status: 'independent',
          updated_at: now,
        })

        // New user redirect to complete profile
        return NextResponse.redirect(`${origin}/dashboard/customer?welcome=true&setup=1`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link_expired`)
}
