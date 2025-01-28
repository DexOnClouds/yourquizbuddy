'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, AlertCircle } from 'lucide-react';
import Image from 'next/image';

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
  }>;
}

interface AttemptData {
  userId: string;
  quizId: string;
  subject: string;
  topic: string;
  startTime: string;
  endTime: string;
  totalTimeTaken: number; // in seconds
  score: number;
  maxScore: number;
  answers: Array<{
    questionIndex: number;
    selectedOption: string;
    isCorrect: boolean;
    timeTaken: number;
  }>;
}

export default function AttemptQuiz() {
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

  // Handle answer submission
  const handleAnswer = useCallback(async (option: string) => {
    if (!currentQuiz || !attemptData || !attemptId) return;

    const currentQuestion = currentQuiz.quizdata[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correct_option;
    const scoreChange = isCorrect ? 4 : -1;
    const currentTime = new Date();

    const updatedAttemptData = {
      ...attemptData,
      score: attemptData.score + scoreChange,
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
      
      // Update final attempt data
      await setDoc(doc(db, 'attemptdata', attemptId), finalAttemptData);
      setAttemptData(finalAttemptData); // Update local state with final data
      localStorage.removeItem('currentAttemptId');
    }
  }, [currentQuiz, attemptData, attemptId, currentQuestionIndex, timeLeft]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !showExplanation) {
      handleAnswer('');
    }
  }, [timeLeft, showExplanation, handleAnswer]);

  // Timer effect
  useEffect(() => {
    if (!currentQuiz || showExplanation || isQuizComplete) return;

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
  }, [currentQuiz, currentQuestionIndex, showExplanation, isQuizComplete]);

  // Start quiz
  const startQuiz = async () => {
    if (!selectedSubject || !selectedTopic) return;

    const q = query(
      collection(db, 'quizdata'),
      where('subject', '==', selectedSubject),
      where('topic', '==', selectedTopic)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const quizDoc = querySnapshot.docs[0];
      const quizData = quizDoc.data();
      setCurrentQuiz({
        id: quizDoc.id,
        ...quizData
      } as Quiz);

      const startTime = new Date().toISOString();
      const newAttemptData: AttemptData = {
        userId: auth.currentUser!.uid,
        quizId: quizDoc.id,
        subject: selectedSubject,
        topic: selectedTopic,
        startTime: startTime,
        endTime: '',
        totalTimeTaken: 0,
        score: 0,
        maxScore: quizData.quizdata.length * 4,
        answers: []
      };

      // Create attempt document
      const attemptRef = await addDoc(collection(db, 'attemptdata'), newAttemptData);
      setAttemptId(attemptRef.id);
      localStorage.setItem('currentAttemptId', attemptRef.id);
      
      setAttemptData(newAttemptData);
      setQuizStartTime(new Date(startTime));
    }
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    setSelectedOption('');
    setTimeLeft(60);
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  if (!currentQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1b1f] to-[#2a2d35] text-white p-8">
        <div className="max-w-md mx-auto space-y-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Attempt Quiz
          </h1>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-[#2d2f36] border border-white/10 rounded-xl p-3 focus:border-blue-500/50 outline-none"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {selectedSubject && (
              <div>
                <label className="text-sm text-gray-400 block mb-2">Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-[#2d2f36] border border-white/10 rounded-xl p-3 focus:border-blue-500/50 outline-none"
                >
                  <option value="">Select Topic</option>
                  {topics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              onClick={startQuiz}
              disabled={!selectedSubject || !selectedTopic}
              className="w-full bg-blue-600 hover:bg-blue-500 mt-4 py-6"
            >
              Start Quiz
            </Button>
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
        <div className="bg-[#2d2f36] border border-white/10 rounded-xl p-6 mb-8">
          {currentQuestion.question_type === 'text' ? (
            <p className="text-xl mb-6">{currentQuestion.question}</p>
          ) : (
            <div className="space-y-4 mb-6">
              <Image
                src={currentQuestion.question_image || ''}
                alt="Question"
                width={400}
                height={300}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

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
                  onClick={nextQuestion}
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
    </div>
  );
}
