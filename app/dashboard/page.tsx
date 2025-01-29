'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CircleHelp, Clock, Target, Trophy, PlusCircle, PlayCircle, PenSquare, Zap, Edit, Trash2, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs, getDoc, doc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useAuth } from '@/hooks/useAuth';
import { DeleteConfirmation } from '@/components/popup/deleteconfirmation';

interface AttemptData {
  id: string;
  score: number;
  maxScore: number;
  startTime: string;
  subject: string;
  topic: string;
  quizId: string;
  userId: string;
}

interface QuizData {
  id: string;
  subject: string;
  topic: string;
  created_by: string;
}

export default function Dashboard() {
  useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userQuizzes, setUserQuizzes] = useState<QuizData[]>([]);
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());
  const [dashboardData, setDashboardData] = useState<{
    stats: {
      totalQuizzes: number;
      avgScore: number;
      attemptsToday: number;
    };
    recentAttempts: AttemptData[];
    subjectsCount: number;
    topicsCount: number;
  }>({
    stats: {
      totalQuizzes: 0,
      avgScore: 0,
      attemptsToday: 0
    },
    recentAttempts: [],
    subjectsCount: 0,
    topicsCount: 0
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'subject' | 'topic', value: string, id?: string } | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/auth');
      } else {
        setUserName(user.displayName || 'User');
        fetchDashboardData();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Get recent attempts
      const attemptsQuery = query(
        collection(db, 'attemptdata'),
        where('userId', '==', userId)
      );
      const attemptsSnapshot = await getDocs(attemptsQuery);
      let attempts = attemptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttemptData[];

      // Sort manually since we can't use orderBy
      attempts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      const recentAttempts = attempts.slice(0, 3); // Get only the 3 most recent

      // Calculate attempt stats
      let totalScore = 0;
      let totalMaxScore = 0;
      let attemptsToday = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      attempts.forEach(attempt => {
        totalScore += attempt.score || 0;
        totalMaxScore += attempt.maxScore || 0;
        
        const attemptDate = new Date(attempt.startTime);
        if (attemptDate >= today) {
          attemptsToday++;
        }
      });

      // Get user's quizzes
      const quizQuery = query(
        collection(db, 'quizdata'),
        where('created_by', '==', userId)
      );
      const quizSnapshot = await getDocs(quizQuery);
      const quizzes = quizSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizData[];
      setUserQuizzes(quizzes);

      // Calculate average score
      const avgScore = totalMaxScore > 0 
        ? Math.round((totalScore / totalMaxScore) * 100) 
        : 0;

      const dashboardData = {
        recentAttempts,
        stats: {
          totalQuizzes: quizSnapshot.size,
          avgScore,
          attemptsToday
        },
        subjectsCount: 0,
        topicsCount: 0
      };

      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // Clear firebase token cookie
      Cookies.remove('firebase-token');
      toast.success('Successfully logged out');
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const confirmDelete = (type: 'subject' | 'topic', value: string, id?: string) => {
    setDeleteTarget({ type, value, id });
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      if (deleteTarget.type === 'topic' && deleteTarget.id) {
        await deleteDoc(doc(db, 'quizdata', deleteTarget.id));
        toast.success('Topic deleted successfully');
      } else if (deleteTarget.type === 'subject') {
        const subjectQuizzes = userQuizzes.filter(quiz => quiz.subject === deleteTarget.value);
        const deletePromises = subjectQuizzes.map(quiz => deleteDoc(doc(db, 'quizdata', quiz.id)));
        await Promise.all(deletePromises);
        toast.success('Subject deleted successfully');
      }
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteTopic = (quizId: string, topic: string) => {
    confirmDelete('topic', topic, quizId);
  };

  const handleDeleteSubject = (subject: string) => {
    confirmDelete('subject', subject);
  };

  const toggleSubject = (subject: string) => {
    setOpenSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
      } else {
        newSet.add(subject);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1b1f] to-[#2a2d35] text-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Group quizzes by subject
  const groupedQuizzes = userQuizzes.reduce((acc, quiz) => {
    if (!acc[quiz.subject]) {
      acc[quiz.subject] = [];
    }
    acc[quiz.subject].push(quiz);
    return acc;
  }, {} as Record<string, QuizData[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1b1f] to-[#2a2d35] text-white">
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === 'subject' ? 'Subject' : 'Topic'}`}
        description={`Are you sure you want to delete ${deleteTarget?.type === 'subject' ? 'subject' : 'topic'} "${deleteTarget?.value}"? All associated quizzes will be permanently deleted.`}
      />

      {/* Header */}
      <header className="bg-[#1a1b1f]/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-500" />
            YourQuizBuddy
          </h1>
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-gray-300">👋 {userName}</span>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="hover:bg-red-500/95 text-gray-300"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Greeting */}
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <h2 className="text-2xl font-semibold text-white">Hello, {userName}!</h2>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Quizzes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-[#9b3635] via-[#ff99c2] to-[#a40300] rounded-lg p-6 shadow-lg animate-gradient-x relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              {/* Icon Container */}
              <div className="p-3 bg-black/20 rounded-lg backdrop-blur-lg shadow-inner hover:bg-black/30 transition-colors duration-300">
                <CircleHelp className="w-7 h-7 text-purple-100/90 transition-transform group-hover:scale-110" />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/80 tracking-wide">
                  Total Quizzes
                </p>
                <p className="text-2xl font-bold text-pink-200 text-shadow-black">
                  {dashboardData?.stats?.totalQuizzes}
                  <span className="text-lg text-pink-200 ml-1.5">quizzes</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Average Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gradient-to-br from-[#63d1f9] via-[#475255] to-[#63d1f9] rounded-lg p-6 shadow-lg animate-gradient-x relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              {/* Icon Container */}
              <div className="p-3 bg-black/20 rounded-lg backdrop-blur-lg shadow-inner hover:bg-black/30 transition-colors duration-300">
                <Target className="w-6 h-6 text-blue-400 transition-transform group-hover:scale-110" />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-200 tracking-wide">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-blue-300/80 text-shadow-black">
                  {dashboardData?.stats?.avgScore}%
                </p>
              </div>
            </div>
          </motion.div>

          {/* Attempts Today */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gradient-to-br from-[#ffd986] via-[#8f6813] to-[#ffd986] rounded-lg p-6 shadow-lg animate-gradient-x relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              {/* Icon Container */}
              <div className="p-3 bg-black/20 rounded-lg backdrop-blur-lg shadow-inner hover:bg-black/30 transition-colors duration-300">
                <Clock className="w-6 h-6 text-orange-400 transition-transform group-hover:scale-110" />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-100/80 tracking-wide">
                  Attempts Today
                </p>
                <p className="text-2xl font-bold text-orange-300 text-shadow-black">
                  {dashboardData?.stats?.attemptsToday}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-6 justify-center py-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 max-w-md"
          >
            <Button
              onClick={() => router.push('/create-quiz')}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <PlusCircle className="w-6 h-6" />
              Create Quiz
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 max-w-md"
          >
            <Button
              onClick={() => router.push('/attempt-quiz')}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <PlayCircle className="w-6 h-6" />
              Take Quiz
            </Button>
          </motion.div>
        </div>

        {/* My Quizzes */}
        {Object.keys(groupedQuizzes).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">My Quizzes</h2>
            <div className="grid gap-4">
              {Object.entries(groupedQuizzes).map(([subject, topics]) => (
                <motion.div
                  key={subject}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-[#89e6ec] via-[#3131e6] to-[#89e6ec] rounded-lg p-6 shadow-lg relative cursor-pointer animate-gradient-x overflow-hidden"
                  onClick={() => toggleSubject(subject)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex items-center flex-grow">
                      <h3 className="font-medium text-white flex-grow">{subject}</h3>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubject(subject);
                      }}
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 backdrop-blur-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {openSubjects.has(subject) && (
                    <div className="mt-4 space-y-2">
                      {topics.map(quiz => (
                        <div key={quiz.id} className="flex items-center justify-between bg-black/20 rounded-lg p-4 shadow-inner backdrop-blur-md">
                          <div className="space-y-1">
                            <p className="text-sm text-white">{quiz.topic}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.setItem('editQuizId', quiz.id);
                                router.push('/edit-quiz');
                              }}
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 backdrop-blur-md"
                            >
                              <PenSquare className="w-4 h-4 text-white" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTopic(quiz.id, quiz.topic);
                              }}
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 backdrop-blur-md"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Attempts with Pagination */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Recent Attempts</h2>
          <div className="grid gap-4">
            {dashboardData?.recentAttempts.map((attempt: AttemptData, index) => (
              <motion.div
                key={attempt.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-[#451868] via-[#bb6ff5] to-[#7139f5] rounded-lg p-6 shadow-lg animate-gradient-x"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-yellow-400 text-shadow-black capitalize">
                      {attempt.subject}
                    </h3>
                    <p className="text-sm text-red-200 capitalize">
                      {attempt.topic === 'All Topics' ? 'All Topics' : attempt.topic}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-200">Score</p>
                      <p className="font-medium text-gray-200">
                        {attempt.score}/{attempt.maxScore}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-200">Date</p>
                      <p className="font-medium text-gray-200">
                        {new Date(attempt.startTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Show All Button */}
          <div className="flex justify-center mt-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => router.push('/attempts')}
                className="flex items-center gap-2 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="text-base">Show All Attempts</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
