'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, Clock, Target, Trophy, PlusCircle, PlayCircle, PenSquare, Zap } from 'lucide-react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalQuizzes: 0,
      avgScore: 0,
      attemptsToday: 0
    },
    recentAttempts: []
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/auth');
      } else {
        setUserName(user.displayName || 'User');
        fetchDashboardData(user.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch total quizzes created by user
      const quizQuery = query(
        collection(db, 'quizdata'),
        where('created_by', '==', userId)
      );
      const quizSnapshot = await getDocs(quizQuery);
      const totalQuizzes = quizSnapshot.size;

      // Fetch all attempts by user
      const attemptQuery = query(
        collection(db, 'attemptdata'),
        where('userId', '==', userId)
      );
      const attemptSnapshot = await getDocs(attemptQuery);
      const attempts = attemptSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort attempts by startTime manually
      .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      // Calculate average score
      let totalScore = 0;
      let totalMaxScore = 0;
      attempts.forEach(attempt => {
        totalScore += attempt.score || 0;
        totalMaxScore += attempt.maxScore || 0;
      });
      const avgScore = totalMaxScore > 0 
        ? Math.round((totalScore / totalMaxScore) * 100) 
        : 0;

      // Count attempts made today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const attemptsToday = attempts.filter(attempt => {
        const attemptDate = new Date(attempt.startTime);
        return attemptDate >= today;
      }).length;

      // Get 3 most recent attempts with quiz details
      const recentAttempts = await Promise.all(
        attempts.slice(0, 3).map(async attempt => {
          const quizDoc = await getDoc(doc(db, 'quizdata', attempt.quizId));
          const quizData = quizDoc.data() || {};
          
          return {
            id: attempt.id,
            subject: quizData.subject || 'Unknown',
            topic: quizData.topic || 'Unknown',
            score: attempt.score,
            maxScore: attempt.maxScore,
            date: attempt.startTime
          };
        })
      );

      setDashboardData({
        stats: {
          totalQuizzes,
          avgScore,
          attemptsToday
        },
        recentAttempts
      });
    } catch (error) {
      console.error('Dashboard Data Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1b1f] to-[#2a2d35] text-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1b1f] to-[#2a2d35] text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            YourQuizBuddy
          </h1>
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-gray-300">Welcome, {userName}</span>
            <Button 
              onClick={handleSignOut} 
              variant="ghost"
              className="hover:bg-white/10 text-gray-300"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Quizzes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 rounded-lg p-6 backdrop-blur-lg border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Quizzes</p>
                <p className="text-2xl font-semibold">{dashboardData.stats.totalQuizzes}</p>
              </div>
            </div>
          </motion.div>

          {/* Average Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white/5 rounded-lg p-6 backdrop-blur-lg border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Average Score</p>
                <p className="text-2xl font-semibold">{dashboardData.stats.avgScore}%</p>
              </div>
            </div>
          </motion.div>

          {/* Attempts Today */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white/5 rounded-lg p-6 backdrop-blur-lg border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Attempts Today</p>
                <p className="text-2xl font-semibold">{dashboardData.stats.attemptsToday}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Attempts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Attempts</h2>
            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/create-quiz')}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600"
              >
                <PlusCircle className="w-4 h-4" />
                Create Quiz
              </Button>
              <Button
                onClick={() => router.push('/attempt-quiz')}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
              >
                <PlayCircle className="w-4 h-4" />
                Take Quiz
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {dashboardData.recentAttempts.map((attempt: any) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 rounded-lg p-6 backdrop-blur-lg border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{attempt.subject}</h3>
                    <p className="text-sm text-gray-400">{attempt.topic}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Score</p>
                      <p className="font-medium">{attempt.score}/{attempt.maxScore}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Date</p>
                      <p className="font-medium">
                        {new Date(attempt.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}