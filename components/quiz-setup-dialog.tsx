'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface QuizSetupDialogProps {
  onComplete: (subject: string, topic: string) => void;
}

export function QuizSetupDialog({ onComplete }: QuizSetupDialogProps) {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch existing subjects and topics
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'quizdata'));
        const subjectSet = new Set<string>();
        const topicMap = new Map<string, Set<string>>();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          subjectSet.add(data.subject);
          
          if (!topicMap.has(data.subject)) {
            topicMap.set(data.subject, new Set());
          }
          topicMap.get(data.subject)?.add(data.topic);
        });

        setSubjects(Array.from(subjectSet).sort());
        if (selectedSubject) {
          setTopics(Array.from(topicMap.get(selectedSubject) || []).sort());
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [selectedSubject]);

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setSubjectInput('');
    setSelectedTopic('');
    setTopicInput('');
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setTopicInput('');
  };

  const handleComplete = () => {
    const finalSubject = selectedSubject || subjectInput;
    const finalTopic = selectedTopic || topicInput;
    
    if (finalSubject && finalTopic) {
      onComplete(finalSubject, finalTopic);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.toLowerCase().includes(subjectInput.toLowerCase())
  );

  const filteredTopics = topics.filter(topic =>
    topic.toLowerCase().includes(topicInput.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1b1f] rounded-xl p-6 w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-white">Quiz Setup</h2>

        {/* Subject Selection */}
        <div className="space-y-4">
          <label className="text-sm text-gray-400">Subject</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              placeholder={loading ? "Loading subjects..." : "Search or enter new subject"}
              className="w-full bg-[#2d2f36] border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-blue-500/50 outline-none"
            />
          </div>

          {/* Existing Subjects */}
          {filteredSubjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filteredSubjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectSelect(subject)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    selectedSubject === subject
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Topic Selection */}
        {(selectedSubject || subjectInput) && (
          <div className="space-y-4">
            <label className="text-sm text-gray-400">Topic</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Search or enter new topic"
                className="w-full bg-[#2d2f36] border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-blue-500/50 outline-none"
              />
            </div>

            {/* Existing Topics */}
            {selectedSubject && filteredTopics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filteredTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      selectedTopic === topic
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleComplete}
          disabled={!(selectedSubject || subjectInput) || !(selectedTopic || topicInput)}
          className={`w-full py-3 rounded-xl transition ${
            (selectedSubject || subjectInput) && (selectedTopic || topicInput)
              ? 'bg-blue-500 hover:bg-blue-400'
              : 'bg-white/5 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </motion.div>
    </div>
  );
}
