'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'
import LangToggle from '@/app/_lang-toggle'

function LinkExpiredBanner() {
  const searchParams = useSearchParams()
  const { t } = useLang()
  if (searchParams.get('error') !== 'link_expired') return null
  return (
    <div className="bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg mb-4 border border-amber-100">
      {t.login.linkExpired}{' '}
      <a href="/forgot-password" className="underline font-medium">{t.login.requestAgain}</a>.
    </div>
  )
}

function LoggedOutBanner() {
  const searchParams = useSearchParams()
  const { t } = useLang()
  if (searchParams.get('logged_out') !== '1') return null
  return (
    <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4 border border-green-100">
      {t.login.loggedOut}
    </div>
  )
}

function GoogleButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false)
  async function handleGoogle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback` },
    })
  }
  return (
    <button onClick={handleGoogle} disabled={loading}
      className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 bg-white text-gray-800 font-semibold py-3.5 rounded-xl hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-60 text-sm shadow-sm">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {label}
    </button>
  )
}

function LoginForm() {
  const router = useRouter()
  const { t, lang } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(t.login.errorInvalid)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.login.title}</h1>
      <p className="text-gray-500 text-sm mb-6">{t.login.subtitle}</p>

      <Suspense>
        <LoggedOutBanner />
        <LinkExpiredBanner />
      </Suspense>

      <GoogleButton label={t.login.googleLogin ?? 'Log Masuk dengan Google'} />

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">{t.login.orEmail ?? 'or use email'}</span></div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t.login.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              {t.login.password}
            </label>
            <Link href="/forgot-password" className="text-xs text-teal-600 hover:underline">
              {t.login.forgotPw}
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {t.login.submit}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        {t.login.noAccount}{' '}
        <Link href="/register" className="text-teal-600 font-semibold hover:underline">
          {t.login.registerNow}
        </Link>
      </p>
      <p className="text-center mt-3">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← {lang === 'en' ? 'Back to Home' : 'Kembali ke Laman Utama'}
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <LangToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-teal-600" fill="currentColor" />
            <span className="text-2xl font-bold text-teal-600">SenioCare</span>
          </Link>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
