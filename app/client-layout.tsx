'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { usePathname } from 'next/navigation';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !['/', '/auth'].includes(pathname);

  return (
    <div className="min-h-screen bg-transparent">
      {showNav && <Header />}
      <main className={showNav ? "pt-16 pb-16" : ""}>
        {children}
      </main>
      {showNav && <BottomNav />}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#333',
            },
          },
        }}
      />
    </div>
  );
}
