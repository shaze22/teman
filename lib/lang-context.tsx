'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { translations, type Lang, type Translations } from './i18n'

type LangCtx = {
  lang: Lang
  t: Translations
  toggle: () => void
}

const LangContext = createContext<LangCtx>({
  lang: 'en',
  t: translations.en as unknown as Translations,
  toggle: () => {},
})

export function LangProvider({ initial, children }: { initial: Lang; children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial)
  const router = useRouter()

  const toggle = useCallback(async () => {
    const next: Lang = lang === 'bm' ? 'en' : 'bm'
    setLang(next)
    await fetch('/api/lang', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: next }) })
    router.refresh()
  }, [lang, router])

  return (
    <LangContext.Provider value={{ lang, t: translations[lang] as unknown as Translations, toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
