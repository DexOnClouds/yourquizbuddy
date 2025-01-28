'use client';

import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect') || '/dashboard';

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Get the token and set it in cookies
        const token = await user.getIdToken();
        Cookies.set('firebase-token', token, { expires: 7 });
        router.push(redirectPath);
      }
    });

    return () => unsubscribe();
  }, [redirectPath, router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        const token = await result.user.getIdToken();
        Cookies.set('firebase-token', token, { expires: 7 });
        router.push(redirectPath);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-quiz">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-white hover:text-gray-900"
        onClick={() => router.push('/')}
      >
        ← Back to Home
      </Button>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto p-8">
        {/* Auth Card */}
        <div className="bg-pink-200 rounded-3xl p-8 shadow-xl">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to YourQuizBuddy
            </h1>
            <p className="text-gray-600">
              Sign in to start your quiz journey
            </p>
          </div>

          {/* Sign In Button */}
          <div className="space-y-4">
            <Button
              className="w-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center gap-3 h-12 text-base font-medium transition-all duration-200"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {!isLoading && (
                <Image
                  src="/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  priority
                />
              )}
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Continue with Google"
              )}
            </Button>
          </div>

          {/* Terms Text */}
          <p className="mt-6 text-sm text-center text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}