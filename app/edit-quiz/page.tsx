'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Type, Plus, Trash2, Save, Upload, PenSquare, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { uploadToImgBB } from '@/lib/imgbb';
import { useAuthGuard } from '@/utils/authGuard';

interface QuizQuestion {
  question_type: 'text' | 'image';
  question: string;
  question_image?: string;
  question_score: number;
  options: string[];
  correct_option: string;
  explanation: string;
  explanation_image?: string;
  showExplanationImage?: boolean;
}

export default function EditQuiz() {
  useAuthGuard(true);
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    question_type: 'text',
    question: '',
    question_score: 0,
    options: ['1', '2', '3', '4'],
    correct_option: '',
    explanation: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const questionImageRef = useRef<HTMLInputElement>(null);
  const explanationImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/auth');
      } else {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return; 

      const quizId = localStorage.getItem('editQuizId');
      if (!quizId) {
        router.push('/dashboard');
        return;
      }

      try {
        const quizDoc = await getDoc(doc(db, 'quizdata', quizId));
        if (!quizDoc.exists()) {
          console.error('Quiz not found');
          router.push('/dashboard');
          return;
        }

        const quizData = quizDoc.data();
        if (quizData.created_by !== userId) {
          console.error('Unauthorized access');
          router.push('/dashboard');
          return;
        }

        setSubject(quizData.subject || '');
        setTopic(quizData.topic || '');
        setQuestions(quizData.quizdata || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        router.push('/dashboard');
      }
    };

    fetchData();
  }, [userId, router]);

  const handleQuestionTypeChange = (type: 'text' | 'image') => {
    setCurrentQuestion({ ...currentQuestion, question_type: type });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleImageUpload = async (file: File, type: 'question' | 'explanation') => {
    try {
      setIsUploading(true);
      const imageUrl = await uploadToImgBB(file);
      if (type === 'question') {
        setCurrentQuestion({ ...currentQuestion, question_image: imageUrl });
      } else {
        setCurrentQuestion({ ...currentQuestion, explanation_image: imageUrl });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent, type: 'question' | 'explanation') => {
    const items = Array.from(e.clipboardData.items);
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleImageUpload(file, type);
        }
      }
    }
  };

  const addQuestion = () => {
    const isValid = currentQuestion.question_type === 'text' 
      ? currentQuestion.question && currentQuestion.correct_option
      : currentQuestion.question_image && currentQuestion.correct_option;

    if (isValid) {
      setQuestions([...questions, currentQuestion]);
      setCurrentQuestion({
        question_type: 'text',
        question: '',
        question_score: 0,
        options: ['1', '2', '3', '4'],
        correct_option: '',
        explanation: ''
      });
      if (questionImageRef.current) questionImageRef.current.value = '';
      if (explanationImageRef.current) explanationImageRef.current.value = '';
    }
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    removeQuestion(index);
  };

  const saveQuiz = async () => {
    if (!subject || !topic || questions.length === 0 || !userId) {
      console.error('Missing required fields');
      return;
    }

    try {
      const quizId = localStorage.getItem('editQuizId');
      if (!quizId) {
        console.error('No quiz ID found');
        return;
      }

      const updateData = {
        quizdata: questions,
        updated_at: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'quizdata', quizId), updateData, { merge: true });
      localStorage.removeItem('editQuizId'); 
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating quiz:', error);
    }
  };

  const quickSave = async () => {
    if (!subject || !topic || questions.length === 0 || !userId) {
      console.error('Missing required fields');
      return;
    }

    try {
      const quizId = localStorage.getItem('editQuizId');
      if (!quizId) {
        console.error('No quiz ID found');
        return;
      }

      const updateData = {
        quizdata: questions,
        updated_at: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'quizdata', quizId), updateData, { merge: true });
    } catch (error) {
      console.error('Error updating quiz:', error);
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
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Edit Quiz
            </h1>
            <p className="text-gray-400 mt-1">
              {subject} • {topic}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={saveQuiz}
              className="bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button
              onClick={quickSave}
              className="bg-green-600 hover:bg-green-500 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Question Type Selection */}
          <div className="flex gap-4">
            <Button
              onClick={() => handleQuestionTypeChange('text')}
              className={`flex items-center gap-2 ${
                currentQuestion.question_type === 'text' 
                ? 'bg-blue-600' 
                : 'bg-[#2d2f36] hover:bg-[#3d3f46]'
              }`}
            >
              <Type className="w-4 h-4" />
              Text
            </Button>
            <Button
              onClick={() => handleQuestionTypeChange('image')}
              className={`flex items-center gap-2 ${
                currentQuestion.question_type === 'image' 
                ? 'bg-blue-600' 
                : 'bg-[#2d2f36] hover:bg-[#3d3f46]'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Image
            </Button>
          </div>

          {/* Question Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              {currentQuestion.question_type === 'text' ? (
                <textarea
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                  onPaste={(e) => handlePaste(e, 'question')}
                  placeholder="Enter your question here..."
                  className="w-full p-3 rounded-lg bg-[#2a2d35] border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              ) : (
                <>
                  <label className="text-sm text-gray-400">Question Image</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      ref={questionImageRef}
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'question')}
                      className="hidden"
                    />
                    <Button
                      onClick={() => questionImageRef.current?.click()}
                      disabled={isUploading}
                      className={`bg-[#2d2f36] hover:bg-[#3d3f46] flex items-center gap-2 ${
                        !currentQuestion.question_image && 'animate-pulse'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {currentQuestion.question_image ? 'Change Image' : 'Upload Question Image'}
                    </Button>
                    {currentQuestion.question_type === 'image' && currentQuestion.question_image && (
                      <div className="mb-4">
                        <div className="min-w-[400px] min-h-[200px] inline-flex justify-center items-center">
                          <Image
                            src={currentQuestion.question_image}
                            alt="Question"
                            width={600}
                            height={450}
                            className="rounded-lg object-contain"
                            style={{
                              minWidth: '400px',
                              minHeight: '200px',
                              maxWidth: '100%',
                              maxHeight: '600px'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="bg-[#2d2f36] border border-white/10 rounded-xl p-3 focus:border-blue-500/50 outline-none"
                />
              ))}
            </div>

            {/* Correct Option & Score */}
            <div className="grid grid-cols-2 gap-4">
              <select
                value={currentQuestion.correct_option}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_option: e.target.value })}
                className="bg-[#2d2f36] border border-white/10 rounded-xl p-3 focus:border-blue-500/50 outline-none"
              >
                <option value="">Select Correct Option</option>
                {['A', 'B', 'C', 'D'].map((letter) => (
                  <option key={letter} value={letter}>
                    Option {letter}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Score"
                value={currentQuestion.question_score}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_score: Number(e.target.value) })}
                className="bg-[#2d2f36] border border-white/10 rounded-xl p-3 focus:border-blue-500/50 outline-none"
              />
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <textarea
                value={currentQuestion.explanation}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                onPaste={(e) => handlePaste(e, 'explanation')}
                placeholder="Enter explanation for the correct answer..."
                className="w-full p-3 rounded-lg bg-[#2a2d35] border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  ref={explanationImageRef}
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'explanation')}
                  className="hidden"
                />
                <Button
                  onClick={() => explanationImageRef.current?.click()}
                  disabled={isUploading}
                  className="bg-[#2d2f36] hover:bg-[#3d3f46] flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Explanation Image
                </Button>
                {currentQuestion.explanation_image && (
                  <div className="mb-4">
                    <div className="min-w-[400px] min-h-[200px] inline-flex justify-center items-center">
                      <Image
                        src={currentQuestion.explanation_image}
                        alt="Explanation"
                        width={600}
                        height={450}
                        className="rounded-lg object-contain"
                        style={{
                          minWidth: '400px',
                          minHeight: '200px',
                          maxWidth: '100%',
                          maxHeight: '600px'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={addQuestion}
              className="w-full bg-green-600 hover:bg-green-500 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>
        </div>

        {/* Question List */}
        {questions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Quiz Questions</h2>
            <div className="space-y-4">
              {questions.map((q, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#2d2f36] border border-white/10 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <span className="text-sm text-gray-400">Question {index + 1}</span>
                      {q.question_type === 'text' ? (
                        <p>{q.question}</p>
                      ) : (
                        q.question_type === 'image' && (
                          <div className="mb-4">
                            <div className="min-w-[400px] min-h-[200px] inline-flex justify-center items-center">
                              <Image
                                src={q.question_image || ''}
                                alt="Question"
                                width={600}
                                height={450}
                                className="rounded-lg object-contain"
                                style={{
                                  minWidth: '400px',
                                  minHeight: '200px',
                                  maxWidth: '100%',
                                  maxHeight: '600px'
                                }}
                              />
                            </div>
                          </div>
                        )
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {q.options.map((opt, i) => (
                          <div 
                            key={i}
                            className={`p-2 rounded ${
                              String.fromCharCode(65 + i) === q.correct_option
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-white/5'
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-400">Score: {q.question_score}</p>
                        <div className="text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <span>Explanation: {q.explanation}</span>
                            {q.explanation_image && (
                              <Button
                                onClick={() => {
                                  const newQuestions = [...questions];
                                  newQuestions[index] = {
                                    ...newQuestions[index],
                                    showExplanationImage: !newQuestions[index].showExplanationImage
                                  };
                                  setQuestions(newQuestions);
                                }}
                                variant="ghost"
                                className="p-0 h-auto hover:bg-transparent"
                              >
                                {q.showExplanationImage ? (
                                  <ChevronUp className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-blue-400" />
                                )}
                              </Button>
                            )}
                          </div>
                          {q.explanation_image && q.showExplanationImage && (
                            <div className="mt-2">
                              <div className="min-w-[400px] min-h-[200px] inline-flex justify-center items-center">
                                <Image
                                  src={q.explanation_image}
                                  alt="Explanation"
                                  width={600}
                                  height={450}
                                  className="rounded-lg object-contain"
                                  style={{
                                    minWidth: '400px',
                                    minHeight: '200px',
                                    maxWidth: '100%',
                                    maxHeight: '600px'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => editQuestion(index)}
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                      >
                        <PenSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => removeQuestion(index)}
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}


      </main>
    </div>
  );
}
