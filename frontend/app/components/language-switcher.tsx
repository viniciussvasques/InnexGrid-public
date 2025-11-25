'use client'

import { useState, useEffect } from 'react'
import { Languages } from 'lucide-react'
import { useLanguage } from '../../lib/language-context'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const languages = [
    { code: 'pt' as const, name: 'Português', flag: '🇧🇷' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  ]

  // Retornar placeholder durante SSR
  if (!mounted) {
    return <div className="w-9 h-9" aria-hidden="true" />
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
        aria-label="Switch language"
        role="button"
        tabIndex={0}
      >
        <Languages className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar o menu quando clicar fora */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            role="presentation"
          />

          {/* Menu de idiomas */}
          <div
            className="absolute right-0 top-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-[140px]"
            role="menu"
            aria-orientation="vertical"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setLanguage(lang.code)
                    setIsOpen(false)
                  }
                }}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:bg-orange-50 dark:focus:bg-orange-900/30 ${
                  lang.code === language
                    ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                role="menuitem"
                tabIndex={0}
              >
                <span className="text-lg" role="img" aria-label={`${lang.name} flag`}>{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
                {lang.code === language && (
                  <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full" aria-hidden="true"></div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
