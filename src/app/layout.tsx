import type { Metadata, Viewport } from 'next'
import { Syncopate, DM_Sans } from 'next/font/google'
import './globals.css'
import { IOSInstallPrompt } from '@/components/pwa/IOSInstallPrompt'
import { AndroidInstallPrompt } from '@/components/pwa/AndroidInstallPrompt'
import { createClient } from '@/lib/supabase/server'

const syncopate = Syncopate({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-syncopate',
  display: 'swap',
})

const dmSans = DM_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#0E0E1A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Strive Personal — Evolução que você vê',
  description:
    'A plataforma completa para personal trainers gerenciarem alunos, prescreverem treinos e acompanharem resultados em tempo real.',

  manifest: '/manifest.json',

  // Apple Web App
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Strive',
    startupImage: [
      // iPhone 14 Pro Max / 15 Pro Max (430x932)
      {
        url: '/splash/apple-splash-1290x2796.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 14 Pro / 15 Pro (393x852)
      {
        url: '/splash/apple-splash-1179x2556.png',
        media:
          '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 14 Plus (428x926)
      {
        url: '/splash/apple-splash-1284x2778.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 14 / 13 / 12 (390x844)
      {
        url: '/splash/apple-splash-1170x2532.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 11 / XR (414x896)
      {
        url: '/splash/apple-splash-828x1792.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)',
      },
      // iPhone SE 3rd gen / 8 (375x667)
      {
        url: '/splash/apple-splash-750x1334.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      // iPad Pro 12.9" (1024x1366)
      {
        url: '/splash/apple-splash-2048x2732.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
      // iPad Pro 11" (834x1194)
      {
        url: '/splash/apple-splash-1668x2388.png',
        media:
          '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)',
      },
      // iPad Air / Mini (820x1180)
      {
        url: '/splash/apple-splash-1640x2360.png',
        media:
          '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },

  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon-32.png',
  },

  openGraph: {
    title: 'Strive Personal',
    description: 'Evolução que você vê.',
    type: 'website',
  },
}

async function getAndroidStoreUrl(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_versions')
    .select('store_url')
    .eq('platform', 'android')
    .single()

  return data?.store_url ?? null
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const androidStoreUrl = await getAndroidStoreUrl()

  return (
    <html lang="pt-BR" className={`${syncopate.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">
        {children}
        <IOSInstallPrompt />
        <AndroidInstallPrompt storeUrl={androidStoreUrl} />
      </body>
    </html>
  )
}
