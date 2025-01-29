'use client';

import Image from "next/image";
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  useAuth(); // Add auth check

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-500 to-gray-500">
      <Header />
      <main className="flex-1">
        {/* Hero Section - Adjusted for mobile layout */}
        <section className="pt-20 pb-16 md:py-24 relative min-h-[600px] md:min-h-[700px]">
          {/* Background gradients */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/90 via-blue-500/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/90 via-blue-500/70 to-transparent z-10" />
          </div>

          <div className="container mx-auto px-4 relative z-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              {/* Text Content */}
              <div className="flex-1 space-y-6 text-center md:text-left z-30">
                <h1 className="text-4xl md:text-6xl font-bold text-white">
                  Create Custom Quizzes<br />
                  <span className="text-red-400">Your Way</span>
                </h1>
                <p className="text-xl text-gray-100 max-w-xl mx-auto md:mx-0">
                  Design personalized quizzes for learning, teaching, or fun. Add images, 
                  multiple choice questions, and more with our easy-to-use quiz builder.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Button 
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-8"
                    onClick={() => router.push('/auth')}
                  >
                    Create Quiz
                  </Button>
                  <Button 
                    size="lg"
                    className="bg-black text-gray-100 hover:bg-gray-700/20 px-8"
                    onClick={() => router.push('/auth')}
                  >
                    Take a Quiz
                  </Button>
                </div>
              </div>

              {/* Image Container - Repositioned for mobile */}
              <div className="w-full md:w-1/2 relative">
                <div className="relative h-[400px] md:h-[600px] mt-8 md:mt-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/90 via-transparent to-transparent z-10" />
                  <Image
                    src="/girlquestion.png"
                    alt="Girl with Question"
                    fill
                    className="object-contain object-center md:object-right-top"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
              Everything You Need for Perfect Quizzes
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon="✏️"
                title="Easy Creation"
                description="Intuitive quiz builder with support for multiple question types, images, and custom scoring."
              />
              <FeatureCard
                icon="🎯"
                title="Custom Categories"
                description="Organize quizzes by subject, difficulty level, or create your own custom categories."
              />
              <FeatureCard
                icon="📊"
                title="Detailed Analytics"
                description="Track performance, view detailed statistics, and export results for further analysis."
              />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-white/5 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">Ready to Create Your First Quiz?</h2>
            <p className="text-xl text-gray-100 mb-8">
              Join thousands of educators and learners who are already using YourQuizBuddy
            </p>
            <Button 
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-12"
              onClick={() => router.push('/create')}
            >
              Get Started Now
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-gray-100">{description}</p>
    </div>
  );
}