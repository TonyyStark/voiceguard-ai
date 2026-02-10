import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VoiceGuard AI - Voice Biometric Authentication',
  description: 'Secure voice authentication with liveness detection. Prevents replay attacks using AI-powered articulatory gesture analysis.',
  keywords: ['voice biometrics', 'authentication', 'liveness detection', 'AI security'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}