import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import Cookies from 'js-cookie';

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/create-quiz',
  '/edit-quiz',
  '/attempt-quiz',
  '/attempts'
];

// Paths that should redirect to dashboard if user is authenticated
const authPaths = ['/', '/auth'];

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const token = Cookies.get('firebase-token');
      
      // If accessing protected routes without being authenticated, redirect to auth
      if (protectedPaths.some(path => pathname?.startsWith(path)) && !user) {
        const redirectPath = pathname;
        router.push(`/auth?redirect=${encodeURIComponent(redirectPath || '')}`);
        return;
      }

      // If accessing auth pages or homepage while authenticated, redirect to dashboard
      if (authPaths.includes(pathname || '') && user) {
        const redirectTo = searchParams?.get('redirect') || '/dashboard';
        router.push(redirectTo);
        return;
      }
    });

    return () => unsubscribe();
  }, [pathname, router, searchParams]);
}
