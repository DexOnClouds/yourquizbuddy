'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Axe, AlertCircle, Notebook, Star, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/utils/authGuard';
import toast from 'react-hot-toast';

interface Quiz {
  id: string;
  subject: string;
  topic: string;
  quizdata: Array<{
    question: string;
    question_type: 'text' | 'image';
    question_image?: string;
    options: string[];
    correct_option: string;
    explanation: string;
    explanation_image?: string;
    question_score: number;
    difficulty_level: string;
    topic: string;
  }>;
}

interface AttemptData {
  userId: string;
  quizId: string;
  subject: string;
  topic: string;
  startTime: string;
  endTime: string;
  totalTimeTaken: number;
  score: number;
  maxScore: number;
  answers: Array<{
    questionIndex: number;
    selectedOption: string;
    isCorrect: boolean;
    timeTaken: number;
  }>;
}

// Helper function to get difficulty level based on question score
const getDifficultyLevel = (score: number) => {
  if (score >= 80) return { label: 'Very Easy', color: 'text-green-400' };
  if (score >= 40) return { label: 'Easy', color: 'text-emerald-400' };
  if (score >= -30) return { label: 'Moderate', color: 'text-yellow-400' };
  if (score >= -70) return { label: 'Hard', color: 'text-orange-400' };
  return { label: 'Mindfuck', color: 'text-red-400' };
};

export default function AttemptQuiz() {
  useAuth();
  useAuthGuard(true);
  const router = useRouter();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute per question
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(10);
  const [totalAvailableQuestions, setTotalAvailableQuestions] = useState<number>(0);
  const [useAllQuestions, setUseAllQuestions] = useState<boolean>(false);
  const [useTimer, setUseTimer] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  // Check for existing attempt
  useEffect(() => {
    const checkExistingAttempt = async () => {
      const attemptIdFromStorage = localStorage.getItem('currentAttemptId');
      if (attemptIdFromStorage) {
        const attemptDoc = await getDoc(doc(db, 'attemptdata', attemptIdFromStorage));
        if (attemptDoc.exists() && !attemptDoc.data().endTime) {
          const attemptData = attemptDoc.data() as AttemptData;
          setAttemptId(attemptIdFromStorage);
          setAttemptData(attemptData);

          // Fetch quiz data
          const quizDoc = await getDoc(doc(db, 'quizdata', attemptData.quizId));
          if (quizDoc.exists()) {
            setCurrentQuiz({
              id: quizDoc.id,
              ...quizDoc.data()
            } as Quiz);

            // Resume from last answered question
            const lastAnsweredIndex = attemptData.answers.length - 1;
            setCurrentQuestionIndex(lastAnsweredIndex + 1);
            setSelectedSubject(attemptData.subject);
            setSelectedTopic(attemptData.topic);
            setQuizStartTime(new Date(attemptData.startTime));

            // Calculate remaining time for current question
            const now = new Date();
            const lastAnswerTime = lastAnsweredIndex >= 0
              ? attemptData.answers[lastAnsweredIndex].timeTaken
              : 0;
            const elapsedTime = Math.floor((now.getTime() - new Date(attemptData.startTime).getTime()) / 1000);
            const timeForCurrentQuestion = elapsedTime - (lastAnsweredIndex + 1) * 60;
            setTimeLeft(Math.max(0, 60 - timeForCurrentQuestion));
          }
        } else {
          localStorage.removeItem('currentAttemptId');
        }
      }
    };

    checkExistingAttempt();
  }, []);

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      const querySnapshot = await getDocs(collection(db, 'quizdata'));
      const uniqueSubjects = new Set<string>();
      querySnapshot.forEach((doc) => {
        uniqueSubjects.add(doc.data().subject);
      });
      setSubjects(Array.from(uniqueSubjects));
    };
    fetchSubjects();
  }, []);

  // Fetch topics when subject is selected
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedSubject) return;
      const q = query(
        collection(db, 'quizdata'),
        where('subject', '==', selectedSubject)
      );
      const querySnapshot = await getDocs(q);
      const uniqueTopics = new Set<string>();
      querySnapshot.forEach((doc) => {
        uniqueTopics.add(doc.data().topic);
      });
      setTopics(Array.from(uniqueTopics));
    };
    fetchTopics();
  }, [selectedSubject]);

  // Effect to fetch total available questions when subject changes
  useEffect(() => {
    const fetchTotalQuestions = async () => {
      if (!selectedSubject) {
        setTotalAvailableQuestions(0);
        return;
      }

      try {
        let q;
        if (selectedTopic === 'all') {
          // Query all topics for the selected subject
          q = query(
            collection(db, 'quizdata'),
            where('subject', '==', selectedSubject)
          );
        } else {
          // Query specific topic
          q = query(
            collection(db, 'quizdata'),
            where('subject', '==', selectedSubject),
            where('topic', '==', selectedTopic)
          );
        }
        
        const snapshot = await getDocs(q);
        let total = 0;
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.quizdata && Array.isArray(data.quizdata)) {
            total += data.quizdata.length;
          }
        });

        setTotalAvailableQuestions(total);
        // Set a reasonable default for custom question count
        setCustomQuestionCount(Math.min(10, total));
      } catch (error) {
        console.error('Error fetching total questions:', error);
        toast.error('Error fetching question count');
      }
    };

    fetchTotalQuestions();
  }, [selectedSubject, selectedTopic]);

  // Handle answer submission
  const handleAnswer = useCallback(async (option: string) => {
    if (!currentQuiz || !attemptData || !attemptId) return;

    const currentQuestion = currentQuiz.quizdata[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correct_option;

    // Update question score
    const scoreChange = isCorrect ? 10 : -10;
    const newQuestionScore = Math.min(100, Math.max(-100, currentQuestion.question_score + scoreChange));

    // Update quiz document with new question score
    const quizRef = doc(db, 'quizdata', currentQuiz.id);
    const quizDoc = await getDoc(quizRef);
    if (quizDoc.exists()) {
      const quizData = quizDoc.data();
      const updatedQuizData = {
        ...quizData,
        quizdata: quizData.quizdata.map((q: any, index: number) =>
          index === currentQuestionIndex
            ? { ...q, question_score: newQuestionScore }
            : q
        )
      };
      await setDoc(quizRef, updatedQuizData);
    }

    // Update attempt data
    const updatedAttemptData = {
      ...attemptData,
      score: attemptData.score + (isCorrect ? 4 : -1),
      answers: [
        ...attemptData.answers,
        {
          questionIndex: currentQuestionIndex,
          selectedOption: option,
          isCorrect,
          timeTaken: 60 - timeLeft
        }
      ]
    };

    // Update attempt in Firestore
    await setDoc(doc(db, 'attemptdata', attemptId), updatedAttemptData);
    setAttemptData(updatedAttemptData);
    setSelectedOption(option);
    setShowExplanation(true);

    // If this was the last question, end the quiz
    if (currentQuestionIndex === currentQuiz.quizdata.length - 1) {
      const endTime = new Date().toISOString();
      const finalAttemptData = {
        ...updatedAttemptData,
        endTime,
        totalTimeTaken: Math.floor((new Date(endTime).getTime() - new Date(attemptData.startTime).getTime()) / 1000)
      };

      // Set a timeout to end the quiz after 3 seconds
      setTimeout(async () => {
        await setDoc(doc(db, 'attemptdata', attemptId), finalAttemptData);
        setAttemptData(finalAttemptData);
        localStorage.removeItem('currentAttemptId');
        setIsQuizComplete(true);
      }, 3000);
    }
  }, [currentQuiz, attemptData, attemptId, currentQuestionIndex, timeLeft]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !showExplanation && useTimer) {
      handleAnswer('');
    }
  }, [timeLeft, showExplanation, handleAnswer, useTimer]);

  // Timer effect
  useEffect(() => {
    if (!currentQuiz || showExplanation || isQuizComplete || !useTimer) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(''); // Auto-submit on time out
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuiz, currentQuestionIndex, showExplanation, isQuizComplete, useTimer]);

  // Start quiz
  const startQuiz = async () => {
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    try {
      setLoading(true); // Add loading state
      let quizSnapshot;
      if (selectedTopic === 'all') {
        // Query for all topics in the subject
        const q = query(
          collection(db, 'quizdata'),
          where('subject', '==', selectedSubject)
        );
        quizSnapshot = await getDocs(q);
      } else {
        // Query for specific topic
        const q = query(
          collection(db, 'quizdata'),
          where('subject', '==', selectedSubject),
          where('topic', '==', selectedTopic)
        );
        quizSnapshot = await getDocs(q);
      }

      if (quizSnapshot.empty) {
        toast.error('No questions found for the selected criteria');
        return;
      }

      let allQuestions: any[] = [];
      let quizId = '';

      if (selectedTopic === 'all') {
        // Combine questions from all topics
        quizSnapshot.docs.forEach(doc => {
          const data = doc.data();
          allQuestions.push(...data.quizdata.map((q: any) => ({
            ...q,
            originalTopic: data.topic // Keep track of original topic
          })));
        });

        setTotalAvailableQuestions(allQuestions.length);

        // Shuffle questions
        for (let i = allQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
        }

        // Use either all questions or the custom count
        if (!useAllQuestions) {
          const questionLimit = Math.min(customQuestionCount, allQuestions.length);
          allQuestions = allQuestions.slice(0, questionLimit);
        }
        quizId = 'combined_' + Date.now();
      } else {
        // Single topic quiz - use all questions
        const randomQuiz = quizSnapshot.docs[Math.floor(Math.random() * quizSnapshot.docs.length)];
        const quizData = randomQuiz.data();
        allQuestions = quizData.quizdata;
        quizId = randomQuiz.id;

        // Use either all questions or the custom count
        if (!useAllQuestions) {
          const questionLimit = Math.min(customQuestionCount, allQuestions.length);
          allQuestions = allQuestions.slice(0, questionLimit);
        }
      }

      // Create the quiz object
      const quiz: Quiz = {
        id: quizId,
        subject: selectedSubject,
        topic: selectedTopic === 'all' ? 'All Topics' : selectedTopic,
        quizdata: allQuestions.map((q: any) => ({
          ...q,
          question_score: q.question_score || 0,
          topic: q.originalTopic // Include the topic in question data
        }))
      };

      // Start the attempt
      const startTime = new Date().toISOString();
      const newAttemptData: AttemptData = {
        userId: auth.currentUser!.uid,
        quizId: quizId,
        subject: selectedSubject,
        topic: selectedTopic === 'all' ? 'All Topics' : selectedTopic,
        startTime: startTime,
        endTime: '',
        totalTimeTaken: 0,
        score: 0,
        maxScore: quiz.quizdata.length * 4,
        answers: []
      };

      // Create attempt document
      const attemptRef = await addDoc(collection(db, 'attemptdata'), newAttemptData);
      setAttemptId(attemptRef.id);
      localStorage.setItem('currentAttemptId', attemptRef.id);

      setCurrentQuiz(quiz);
      setAttemptData(newAttemptData);
      setQuizStartTime(new Date(startTime));
      setTimeLeft(60);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  // Handle subject selection
  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTopic('all'); // Default to 'all' when subject changes
  };

  // Handle topic selection
  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  if (!currentQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1b1f] to-[#2a2d35] text-white">
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
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Start a Quiz</h1>
              <p className="text-gray-400">Select a subject and topic to begin</p>
            </div>

            {/* Subjects */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Notebook className="w-5 h-5" />
                Select Subject
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <Button
                    key={subject}
                    onClick={() => handleSubjectSelect(subject)}
                    className={`h-auto py-4 px-6 ${
                      selectedSubject === subject
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {subject}
                  </Button>
                ))}
              </div>
            </div>

            {/* Topics */}
            {selectedSubject && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Select Topic
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleTopicSelect('all')}
                    className={`h-auto py-4 px-6 ${
                      selectedTopic === 'all'
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    All Topics
                  </Button>
                  {topics.map((topic) => (
                    <Button
                      key={topic}
                      onClick={() => handleTopicSelect(topic)}
                      className={`h-auto py-4 px-6 ${
                        selectedTopic === topic
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Question Count */}
            {selectedTopic && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center space-x-4">
                  <div className="relative inline-block w-14 h-7 select-none transition duration-200 ease-in flex-shrink-0">
                    <input
                      type="checkbox"
                      id="useAllQuestionsSlider"
                      checked={useAllQuestions}
                      onChange={(e) => setUseAllQuestions(e.target.checked)}
                      className="toggle-checkbox absolute w-0 h-0 opacity-0"
                      disabled={loading}
                    />
                    <label
                      htmlFor="useAllQuestionsSlider"
                      className={`toggle-label absolute cursor-pointer top-0 left-0 w-14 h-7 bg-gray-300 rounded-full transition-colors duration-300 ease-in-out
                        ${useAllQuestions ? 'bg-blue-500' : ''}
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out
                          ${useAllQuestions ? 'transform translate-x-7' : ''}`}
                      />
                    </label>
                  </div>
                  <span className={`${loading ? 'opacity-50' : ''}`}>
                    Use all available questions {totalAvailableQuestions > 0 ? `(${totalAvailableQuestions} total)` : '(loading...)'}
                  </span>
                </div>

                {!useAllQuestions && (
                  <div className="flex items-center space-x-2">
                    <label htmlFor="customQuestionCount" className={loading ? 'opacity-50' : ''}>
                      Number of questions:
                    </label>
                    <input
                      type="number"
                      id="customQuestionCount"
                      min="1"
                      max={totalAvailableQuestions}
                      value={customQuestionCount}
                      onChange={(e) => setCustomQuestionCount(Math.min(parseInt(e.target.value) || 1, totalAvailableQuestions))}
                      className="w-20 rounded-md bg-gray-500 border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-500">
                      (Max: {totalAvailableQuestions})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Timer Toggle */}
            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-4">
                <div className="relative inline-block w-14 h-7 select-none transition duration-200 ease-in flex-shrink-0">
                  <input
                    type="checkbox"
                    id="useTimerSlider"
                    checked={useTimer}
                    onChange={(e) => setUseTimer(e.target.checked)}
                    className="toggle-checkbox absolute w-0 h-0 opacity-0"
                    disabled={loading}
                  />
                  <label
                    htmlFor="useTimerSlider"
                    className={`toggle-label absolute cursor-pointer top-0 left-0 w-14 h-7 bg-gray-300 rounded-full transition-colors duration-300 ease-in-out
                      ${useTimer ? 'bg-blue-500' : ''}
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out
                        ${useTimer ? 'transform translate-x-7' : ''}`}
                    />
                  </label>
                </div>
                <span className={`${loading ? 'opacity-50' : ''}`}>
                  Enable 60s timer
                </span>
              </div>
            </div>

            {/* Start Button */}
            {selectedSubject && (
              <Button
                onClick={startQuiz}
                className="w-full py-6 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {loading ? 'Loading...' : 'Start Quiz'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isQuizComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1b1f] to-[#2a2d35] text-white p-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Quiz Complete!</h2>
          <div className="bg-[#2d2f36] border border-white/10 rounded-xl p-6 space-y-4">
            <p className="text-2xl font-bold">
              Score: {attemptData?.score}/{attemptData?.maxScore}
            </p>
            <p className="text-gray-400">
              Time taken: {attemptData?.totalTimeTaken} seconds
            </p>
            <p className="text-gray-400">
              Correct answers: {attemptData?.answers.filter((a) => a.isCorrect).length}/
              {attemptData?.answers.length}
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-500"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = currentQuiz.quizdata[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1b1f] to-[#2a2d35] text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress and Timer */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-sm text-gray-400">
            Question {currentQuestionIndex + 1}/{currentQuiz.quizdata.length}
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className={`${timeLeft <= 10 ? 'text-red-400' : 'text-gray-400'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-[#2d2f36] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">
              Question {currentQuestionIndex + 1} of {currentQuiz.quizdata.length}
            </span>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">{timeLeft}s</span>
            </div>
          </div>

          {/* Topic Badge - Only show in All Topics mode */}
          {currentQuiz.topic === 'All Topics' && currentQuestion.topic && (
            <div className="inline-flex items-center gap-1 bg-gray-700/50 text-gray-300 px-2 py-1 rounded text-xs mb-3">
              <Star className="w-3 h-3" />
              {currentQuestion.topic}
            </div>
          )}

          {/* Question Text or Image */}
          {currentQuestion.question_type === 'image' ? (
            <div className="space-y-4">
              <Image
                src={currentQuestion.question_image || ''}
                alt="Question"
                width={400}
                height={300}
                className="rounded-lg mx-auto"
              />
              <p className="text-lg font-medium">{currentQuestion.question}</p>
            </div>
          ) : (
            <p className="text-lg font-medium">{currentQuestion.question}</p>
          )}
        </div>

        {/* Difficulty Level */}
        <div className="flex items-center gap-2 mb-4">
          <Axe className="w-4 h-4" />
          <span className={`text-sm ${getDifficultyLevel(currentQuestion.question_score).color}`}>
            Difficulty: {getDifficultyLevel(currentQuestion.question_score).label}
          </span>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !selectedOption && handleAnswer(String.fromCharCode(65 + index))}
              disabled={!!selectedOption}
              className={`p-4 rounded-xl text-left transition ${
                selectedOption
                  ? String.fromCharCode(65 + index) === selectedOption
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-white/5'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {String.fromCharCode(65 + index)}. {option}
            </button>
          ))}
        </div>

        {/* Show Explanation Button */}
        {selectedOption && !showExplanation && (
          <Button
            onClick={() => setShowExplanation(true)}
            className="w-full mt-6 bg-green-600 hover:bg-green-500"
          >
            Show Answer
          </Button>
        )}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-[#2d2f36] border border-white/10 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-1" />
              <div>
                <h3 className="font-bold text-blue-400">Explanation</h3>
                <p className="text-gray-300 mt-2">{currentQuestion.explanation}</p>
                <div className="mt-4 p-3 rounded-lg bg-white/5">
                  <p className="text-sm">
                    {selectedOption === currentQuestion.correct_option ? (
                      <span className="text-green-400">Correct! (+4 points)</span>
                    ) : (
                      <span className="text-red-400">
                        Incorrect (-1 point). Correct answer was Option {currentQuestion.correct_option}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            {currentQuestion.explanation_image && (
              <Image
                src={currentQuestion.explanation_image}
                alt="Explanation"
                width={400}
                height={300}
                className="max-w-full h-auto rounded-lg mt-4"
              />
            )}
            {currentQuestionIndex < currentQuiz.quizdata.length - 1 && (
              <Button
                onClick={() => {
                  setShowExplanation(false);
                  setSelectedOption('');
                  setTimeLeft(60);
                  setCurrentQuestionIndex((prev) => prev + 1);
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 mt-6"
              >
                Next Question
              </Button>
            )}
            {currentQuestionIndex === currentQuiz.quizdata.length - 1 && (
              <Button
                onClick={() => setIsQuizComplete(true)}
                className="w-full bg-green-600 hover:bg-green-500 mt-6"
              >
                Show Final Score
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
