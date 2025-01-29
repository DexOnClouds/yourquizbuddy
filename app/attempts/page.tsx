'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, getDoc, doc, deleteDoc } from 'firebase/firestore';
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
  totalTimeTaken: number;
  answers: any[];
}

interface QuizData {
  id: string;
  subject: string;
  topic: string;
  created_by: string;
}

export default function AttemptsPage() {
  useAuth();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const attemptsPerPage = 10;
  const router = useRouter();

  const totalPages = Math.ceil(attempts.length / attemptsPerPage);
  const indexOfLastAttempt = currentPage * attemptsPerPage;
  const indexOfFirstAttempt = indexOfLastAttempt - attemptsPerPage;
  const currentAttempts = attempts.slice(indexOfFirstAttempt, indexOfLastAttempt);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/auth');
      } else {
        setUserName(user.displayName || 'User');
        fetchAttempts();
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch attempts data
  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const attemptsQuery = query(
        collection(db, 'attemptdata'),
        where('userId', '==', userId)
      );
      const attemptsSnapshot = await getDocs(attemptsQuery);
      let attempts = attemptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttemptData[];

      // Sort by date
      attempts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      
      setAttempts(attempts);
    } catch (error) {
      console.error('Error fetching attempts:', error);
      toast.error('Failed to fetch attempts');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      Cookies.remove('firebase-token');
      toast.success('Successfully logged out');
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const clearAllAttempts = async () => {
    if (!auth.currentUser) return;
    
    try {
      setIsDeleting(true);
      const userId = auth.currentUser.uid;
      
      // Get all attempts for the user
      const attemptQuery = query(
        collection(db, 'attemptdata'),
        where('userId', '==', userId)
      );
      const attemptSnapshot = await getDocs(attemptQuery);
      
      // Delete each attempt
      await Promise.all(
        attemptSnapshot.docs.map(doc => deleteDoc(doc.ref))
      );
      
      setAttempts([]); // Clear attempts from state
      setCurrentPage(1); // Reset to first page
      toast.success('All attempts cleared successfully');
    } catch (error) {
      console.error('Error clearing attempts:', error);
      toast.error('Failed to clear attempts');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render attempt card
  const AttemptCard = ({ attempt }: { attempt: AttemptData }) => {
    return (
      <motion.div
        key={attempt.id || Math.random()}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gradient-to-br from-[#451868] via-[#bb6ff5] to-[#7139f5] rounded-lg p-6 shadow-lg animate-gradient-x"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-medium text-yellow-400 text-shadow-black capitalize">
              {attempt.subject || 'Unknown Subject'}
            </h3>
            <p className="text-sm text-red-200 capitalize">
              {attempt.topic === 'all' ? 'All Topics' : attempt.topic || 'Unknown Topic'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-200">Score</p>
              <p className="font-medium text-gray-200">
                {attempt.score || 0}/{attempt.maxScore || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-200">Date</p>
              <p className="font-medium text-gray-200">
                {attempt.startTime 
                  ? new Date(attempt.startTime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'Unknown Date'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-200">Time Taken</p>
              <p className="text-gray-100">
                {attempt.totalTimeTaken
                  ? `${Math.floor(attempt.totalTimeTaken / 60)}m ${attempt.totalTimeTaken % 60}s`
                  : 'Unknown'
                }
              </p>
            </div>
            <div>
              <p className="text-gray-200">Questions</p>
              <p className="text-gray-100">
                {attempt.answers?.length || 0} answered
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
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
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={clearAllAttempts}
        title="Delete All Attempts"
        description="Are you sure you want to delete all your quiz attempts? This action cannot be undone."
        isDeleting={isDeleting}
      />

      {/* Header */}
      <header className="bg-[#1a1b1f]/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="hover:bg-gray-700/95 text-gray-300 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Button>
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-white">All Attempts</h1>
          {attempts.length > 0 && (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Attempts
            </Button>
          )}
        </div>

        {/* Attempts List */}
        <div className="grid gap-4">
          {currentAttempts.map((attempt: AttemptData) => (
            <AttemptCard key={attempt.id} attempt={attempt} />
          ))}

          {attempts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No attempts yet</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {attempts.length > attemptsPerPage && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-white/10 hover:bg-white/20"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                className={currentPage === page ? 
                  "bg-blue-500 hover:bg-blue-600" : 
                  "bg-white/10 hover:bg-white/20"}
              >
                {page}
              </Button>
            ))}
            
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-white/10 hover:bg-white/20"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
