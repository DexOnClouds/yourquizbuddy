'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex">
          <Link href="/" className="flex items-center space-x-2">
          <h1 className="font-bold text-xl ml-4">YourQuizBuddy</h1>
          </Link>
        </div>
      </div>
    </header>
  );
}
