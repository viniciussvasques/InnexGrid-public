import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { LanguageProvider } from '../lib/language-context'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InnexGrid - Decentralized Physical Infrastructure Network',
  description: 'Share your resources and earn tokens with InnexGrid - The future of DePIN',
  keywords: 'DePIN, blockchain, web3, shared resources, distributed computing, tokenization',
  authors: [{ name: 'Innexar' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'InnexGrid - Decentralized Physical Infrastructure Network',
    description: 'Share your resources and earn tokens with InnexGrid',
    url: 'https://innexgrid.com',
    siteName: 'InnexGrid',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'InnexGrid - DePIN Platform'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InnexGrid - Decentralized Physical Infrastructure Network',
    description: 'Share your resources and earn tokens with InnexGrid',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = cookies()
  const langCookie = cookieStore.get('innexgrid-language')?.value
  const initialLanguage = (langCookie === 'en' || langCookie === 'pt') ? langCookie : 'pt'
  return (
    <html lang={initialLanguage === 'en' ? 'en-US' : 'pt-BR'}>
      <body className={inter.className}>
        <LanguageProvider initialLanguage={initialLanguage as any}>
          <Providers>{children}</Providers>
        </LanguageProvider>
      </body>
    </html>
  )
}
