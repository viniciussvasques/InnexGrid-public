'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations } from './i18n'

// Simple translation function that works with nested objects
function getNestedTranslation(obj: any, path: string): string {
  const keys = path.split(/\.|\[|\]/).filter(k => k !== '') // split on dots, brackets
  let result = obj

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]

    // Handle array indices
    if (/^\d+$/.test(key) && Array.isArray(result)) {
      result = result[parseInt(key)]
    } else if (result && typeof result === 'object') {
      result = result[key]
    } else {
      return path // fallback to key path if not found
    }
  }

  return typeof result === 'string' ? result : path
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (path: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
  initialLanguage?: Language
}

export function LanguageProvider({ children, initialLanguage = 'en' }: LanguageProviderProps) {
  const [mounted, setMounted] = useState(false)
  const [language, setLanguage] = useState<Language>(initialLanguage)

  // Load language from localStorage or cookie on mount
  useEffect(() => {
    setMounted(true)
    if (globalThis.window !== undefined) {
      const savedLanguage = localStorage.getItem('innexgrid-language') as Language ||
        document.cookie.split('; ').find(c => c.startsWith('innexgrid-language='))?.split('=')[1] as Language
      if (savedLanguage && ['pt', 'en'].includes(savedLanguage)) {
        setLanguage(savedLanguage)
      }
    }
  }, [])

  // Save language to localStorage & cookie when it changes
  useEffect(() => {
    if (mounted && globalThis.window !== undefined) {
      localStorage.setItem('innexgrid-language', language)
      document.cookie = `innexgrid-language=${language};path=/;max-age=31536000`
    }
  }, [language, mounted])

  const t = (path: string) => getNestedTranslation(translations[language], path)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    // Fallback to default translations if context not available
    return {
      language: 'en' as const,
      setLanguage: () => {},
      t: (path: string) => {
        const keys = path.split('.')
        let result: any = translations.en

        for (const key of keys) {
          if (result && typeof result === 'object') {
            result = result[key]
          } else {
            return path // fallback to key path
          }
        }

        return typeof result === 'string' ? result : path
      }
    }
  }
  return context
}
