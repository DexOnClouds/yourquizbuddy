import { getCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuthGuard(isProtectedRoute: boolean = true) {
  const router = useRouter();
  
  useEffect(() => {
    const token = getCookie('firebase-token');
    
    if (isProtectedRoute && !token) {
      // If accessing protected route without token, redirect to auth
      const redirect = encodeURIComponent(window.location.pathname);
      router.push(`/auth?redirect=${redirect}`);
    } else if (!isProtectedRoute && token) {
      // If accessing auth pages with token, redirect to dashboard
      router.push('/dashboard');
    }
  }, [isProtectedRoute, router]);
}
