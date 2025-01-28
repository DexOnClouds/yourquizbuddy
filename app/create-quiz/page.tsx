'use client';

import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Image as ImageIcon, Type, Plus, Trash2, Save, Upload } from 'lucide-react';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { collection, addDoc, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { QuizSetupDialog } from '@/components/quiz-setup-dialog';
import { uploadToImgBB } from '@/lib/imgbb';
import Image from 'next/image';

interface QuizQuestion {
  question_type: 'text' | 'image';
  question: string;
  question_image?: string;
  question_score: number;
  options: string[];
  correct_option: string;
  explanation: string;
  explanation_image?: string;
}

export default function CreateQuiz() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [showSetup, setShowSetup] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    question_type: 'text',
    question: '',
    question_score: 0,
    options: ['', '', '', ''],
    correct_option: '',
    explanation: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);
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
        options: ['', '', '', ''],
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

  const handleSetupComplete = async (selectedSubject: string, selectedTopic: string) => {
    setSubject(selectedSubject);
    setTopic(selectedTopic);
    
    // Check for existing quiz
    const q = query(
      collection(db, 'quizdata'),
      where('subject', '==', selectedSubject),
      where('topic', '==', selectedTopic)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const quizDoc = querySnapshot.docs[0];
      setExistingQuizId(quizDoc.id);
      setQuestions(quizDoc.data().quizdata || []);
    } else {
      setExistingQuizId(null);
      setQuestions([]);
    }
    
    setShowSetup(false);
  };

  const saveQuiz = async () => {
    if (!subject || !topic || questions.length === 0 || !userId) {
      console.error('Missing required fields');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        router.push('/auth');
        return;
      }

      if (existingQuizId) {
        // Update existing quiz - only update necessary fields
        const updateData = {
          quizdata: questions,
          updated_at: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'quizdata', existingQuizId), updateData, { merge: true });
        console.log('Quiz updated with ID:', existingQuizId);
      } else {
        // Create new quiz with all fields
        const newQuizData = {
          created_by: userId,
          subject: subject.trim(),
          topic: topic.trim(),
          quizdata: questions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'quizdata'), newQuizData);
        console.log('Quiz created with ID:', docRef.id);
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  };

  if (showSetup) {
    return <QuizSetupDialog onComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1b1f] to-[#2a2d35] text-white">
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {existingQuizId ? 'Update Quiz' : 'Create New Quiz'}
            </h1>
            <p className="text-gray-400 mt-1">
              {subject} • {topic}
            </p>
          </div>
          <Button
            onClick={() => setShowSetup(true)}
            variant="ghost"
            className="hover:bg-white/10"
          >
            Change Subject/Topic
          </Button>
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
                <>
                  <label className="text-sm text-gray-400">Question</label>
                  <textarea
                    placeholder="Enter your question"
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                    className="w-full bg-[#2d2f36] border border-white/10 rounded-xl p-3 focus:border-blue-500/50 outline-none min-h-[100px]"
                  />
                </>
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
                      {currentQuestion.question_image ? 'Change Image' : 'Upload Question Image*'}
                    </Button>
                    {currentQuestion.question_type === 'image' && currentQuestion.question_image && (
                      <div className="mb-4">
                        <Image
                          src={currentQuestion.question_image}
                          alt="Question"
                          width={400}
                          height={300}
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                    {!currentQuestion.question_image && (
                      <p className="text-sm text-red-400 mt-2">* Required: Please upload an image for the question</p>
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
              <div className="relative">
                <input
                  type="number"
                  placeholder="Score"
                  value={currentQuestion.question_score}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_score: Number(e.target.value) })}
                  className="w-full bg-[#2d2f36] border border-white/10 rounded-xl p-3 focus:border-blue-500/50 outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 group">
                  <div className="p-2 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black rounded-lg text-xs invisible group-hover:visible">
                    <p className="text-gray-300 mb-1">Score determines question difficulty:</p>
                    <ul className="space-y-1">
                      <li className="text-green-400">100: Easy</li>
                      <li className="text-yellow-400">0: Medium</li>
                      <li className="text-red-400">-100: Hard</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Explanation</label>
              <textarea
                placeholder="Explanation for the correct answer"
                value={currentQuestion.explanation}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                className="w-full bg-[#2d2f36] border border-white/10 rounded-xl p-3 focus:border-blue-500/50 outline-none min-h-[100px]"
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
                    <Image
                      src={currentQuestion.explanation_image}
                      alt="Explanation"
                      width={400}
                      height={300}
                      className="max-w-full h-auto rounded-lg"
                    />
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
            <h2 className="text-xl font-bold">Added Questions</h2>
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
                            <Image
                              src={q.question_image || ''}
                              alt="Question"
                              width={400}
                              height={300}
                              className="max-w-full h-auto rounded-lg"
                            />
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
                    </div>
                    <Button
                      onClick={() => removeQuestion(index)}
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Save Quiz */}
        {questions.length > 0 && (
          <Button
            onClick={saveQuiz}
            className="w-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 py-6"
          >
            <Save className="w-4 h-4" />
            {existingQuizId ? 'Update Quiz' : 'Save Quiz'}
          </Button>
        )}
      </main>
    </div>
  );
}
