import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { AppError, toErrorResponse } from '@/lib/errors'
import type { DbUser } from '@/lib/types'

export interface AuthContext {
  user: { id: string; email: string | undefined }
  dbUser: DbUser
  req: NextRequest
  params: Record<string, string>
}

export interface AdminContext {
  user: { id: string; email: string | undefined }
  dbUser: DbUser & { role: 'super_admin' }
  req: NextRequest
  params: Record<string, string>
}

type RouteCtx = { params?: Promise<Record<string, string>> }

export function withAuth(
  handler: (ctx: AuthContext) => Promise<NextResponse>,
): (req: NextRequest, ctx?: RouteCtx) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new AppError('Unauthorized', 401)

      const { data: dbUser } = await supabaseAdmin
        .from('users').select('*').eq('id', user.id).single()
      if (!dbUser) throw new AppError('Unauthorized', 401)

      const params = ctx?.params ? await ctx.params : {}
      return await handler({ user: { id: user.id, email: user.email }, dbUser: dbUser as DbUser, req, params })
    } catch (err) {
      const { message, status } = toErrorResponse(err)
      return NextResponse.json({ message }, { status })
    }
  }
}

export function withAdmin(
  handler: (ctx: AdminContext) => Promise<NextResponse>,
): (req: NextRequest, ctx?: RouteCtx) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new AppError('Unauthorized', 401)

      const { data: dbUser } = await supabaseAdmin
        .from('users').select('*').eq('id', user.id).single()
      if (!dbUser || dbUser.role !== 'super_admin') throw new AppError('Forbidden', 403)

      const params = ctx?.params ? await ctx.params : {}
      return await handler({
        user: { id: user.id, email: user.email },
        dbUser: dbUser as DbUser & { role: 'super_admin' },
        req,
        params,
      })
    } catch (err) {
      const { message, status } = toErrorResponse(err)
      return NextResponse.json({ message }, { status })
    }
  }
}

export function withPublic(
  handler: (req: NextRequest, params: Record<string, string>) => Promise<NextResponse>,
): (req: NextRequest, ctx?: RouteCtx) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      const params = ctx?.params ? await ctx.params : {}
      return await handler(req, params)
    } catch (err) {
      const { message, status } = toErrorResponse(err)
      return NextResponse.json({ message }, { status })
    }
  }
}
