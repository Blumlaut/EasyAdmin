import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { on } from '../fivem'

export type Translations = Record<string, string>

interface I18nContextValue {
  t: (key: string, params?: Record<string, string | number>) => string
  lang: string
}

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
  lang: 'en',
})

export function useTranslation(): I18nContextValue {
  return useContext(I18nContext)
}

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [translations, setTranslations] = useState<Translations>({})
  const [lang, setLang] = useState('en')

  useEffect(() => {
    return on<{ strings: Translations; lang: string }>('setLanguage', (data) => {
      if (data.strings) setTranslations(data.strings)
      if (data.lang) setLang(data.lang)
    })
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const template = translations[key] ?? key
      if (!params || Object.keys(params).length === 0) return template
      return template.replace(/\{(\w+)\}/g, (_, param) => String(params[param] ?? `{${param}}`))
    },
    [translations],
  )

  const value = useMemo(() => ({ t, lang }), [t, lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
