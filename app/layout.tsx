import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppProvider } from '@/contexts/AppContext';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { ToastHost } from '@/components/ToastHost';
import { LevelUpOverlay } from '@/components/LevelUpOverlay';
import { Aurora } from '@/components/ui/Aurora';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Smartwise — Money skills for Indian students',
  description:
    'Track every rupee, get a Smartwise Score out of 100, and learn to invest with an AI coach built for Indian students.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fc' },
    { media: '(prefers-color-scheme: dark)', color: '#080912' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Applies the stored theme before paint so there is no flash of the wrong palette. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('theme');
                var theme = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                if (theme === 'dark') document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = theme;
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans text-ink antialiased">
        <Aurora />
        <ThemeProvider>
          <AppProvider>
            <OnboardingGuard>{children}</OnboardingGuard>
            <ToastHost />
            <LevelUpOverlay />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
