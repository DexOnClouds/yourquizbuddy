// app/layout.tsx

import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YourQuizBuddy - Create and Take Quizzes',
  description: 'Create, share, and take quizzes on any topic. Learn and test your knowledge with YourQuizBuddy.',
  icons: {
    icon: '/favicon.ico',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <Script id="prefetch-pages" strategy="afterInteractive">
          {`
            if ('connection' in navigator) {
              if (navigator.connection.saveData === false) {
                const links = ['/', '/dashboard', '/visualize', '/notes, /community', '/profile']
                links.forEach(link => {
                  const linkEl = document.createElement('link')
                  linkEl.rel = 'prefetch'
                  linkEl.href = link
                  document.head.appendChild(linkEl)
                })
              }
            }
          `}
        </Script>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
