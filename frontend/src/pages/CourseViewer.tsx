import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowRight,
  PlayCircle,
  FileText,
  CheckCircle,
  Video,
  BrainCircuit,
  XCircle,
  RotateCcw,
} from "lucide-react";
import axios from "axios";

// --- Types ---
interface Lesson {
  id: string;
  title: string;
  content: string;
  video_url: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface Quiz {
  id: string;
  pass_score: number;
  questions: Question[];
}

interface QuizResult {
  score: number;
  passed: boolean;
  pass_score: number;
  correctCount: number;
  totalQuestions: number;
}

export default function CourseViewer() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // 🚀 QUIZ STATE
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [questionId: string]: string;
  }>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // 1. Fetch Course Data
  useEffect(() => {
    const fetchCourse = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      try {
        const response = await axios.get(
          `http://localhost:5000/api/courses/${courseId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const foundCourse = response.data.data;
        setCourse(foundCourse);

        if (foundCourse?.modules?.[0]?.lessons?.[0]) {
          setActiveLesson(foundCourse.modules[0].lessons[0]);
        }
      } catch (error) {
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, navigate]);

  // 2. Fetch Progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!courseId) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/courses/${courseId}/progress`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.data.success) {
          setCompletedLessons(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch progress", error);
      }
    };
    fetchProgress();
  }, [courseId]);

  // 🚀 3. Fetch Quiz whenever active lesson changes
  useEffect(() => {
    if (!activeLesson) return;

    const fetchQuiz = async () => {
      setQuizLoading(true);
      setQuiz(null);
      setQuizResult(null);
      setSelectedAnswers({});

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/lessons/${activeLesson.id}/quiz`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.data.data) {
          setQuiz(response.data.data);
        }
      } catch (error) {
        console.error("Failed to load quiz", error);
      } finally {
        setQuizLoading(false);
      }
    };

    fetchQuiz();
  }, [activeLesson]);

  // 🚀 4. Submit Quiz & Auto-complete lesson if passed
  const handleQuizSubmit = async () => {
    if (!quiz) return;
    setIsSubmittingQuiz(true);
    try {
      const token = localStorage.getItem("token");
      const answerArray = Object.values(selectedAnswers); // Flatten map to array of Option IDs

      const response = await axios.post(
        `http://localhost:5000/api/quizzes/${quiz.id}/submit`,
        { answers: answerArray },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const resultData = response.data.data;
      setQuizResult(resultData);

      // If they passed and haven't already marked the lesson complete, do it for them automatically!
      if (resultData.passed && !completedLessons.includes(activeLesson.id)) {
        await toggleLessonComplete(activeLesson.id, true);
      }
    } catch (error) {
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // Modified toggle completion to accept a forced state (used for auto-complete on pass)
  const toggleLessonComplete = async (
    lessonId: string,
    forceComplete?: boolean,
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/lessons/${lessonId}/progress`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.completed) {
        setCompletedLessons((prev) => [...prev, lessonId]);
      } else {
        setCompletedLessons((prev) => prev.filter((id) => id !== lessonId));
      }
    } catch (error) {
      console.error("Failed to update progress", error);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const videoIdMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?]*)/,
    );
    return videoIdMatch
      ? `https://www.youtube.com/embed/${videoIdMatch[1]}`
      : url;
  };

  const allLessons = course?.modules?.flatMap((m) => m.lessons) || [];
  const currentLessonIndex = activeLesson
    ? allLessons.findIndex((l) => l.id === activeLesson.id)
    : -1;
  const previousLesson =
    currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex !== -1 && currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">
        Loading Classroom...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden">
      {/* LEFT SIDEBAR: Course Curriculum */}
      <aside className="w-full md:w-80 border-r border-white/10 bg-slate-900/50 flex flex-col h-auto md:h-screen overflow-y-auto z-10 shrink-0">
        <div className="p-6 border-b border-white/10 sticky top-0 bg-slate-900 z-20">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h2 className="text-xl font-bold leading-tight">{course?.title}</h2>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {course?.modules?.map((module, mIndex) => (
            <div key={module.id} className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                Module {mIndex + 1}: {module.title}
              </h3>
              <div className="space-y-1">
                {module.lessons?.map((lesson, lIndex) => {
                  const isActive = activeLesson?.id === lesson.id;
                  const isCompleted = completedLessons.includes(lesson.id);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors
                         ${isActive ? "bg-indigo-600 text-white shadow-lg" : "hover:bg-white/5 text-slate-300"}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {lesson.video_url ? (
                          <PlayCircle
                            className={`h-4 w-4 ${isActive ? "text-white" : "text-indigo-400"}`}
                          />
                        ) : (
                          <FileText
                            className={`h-4 w-4 ${isActive ? "text-white" : "text-indigo-400"}`}
                          />
                        )}
                      </div>
                      <span className="text-sm font-medium leading-snug flex-1 pr-2">
                        {lIndex + 1}. {lesson.title}
                      </span>
                      {isCompleted && (
                        <CheckCircle
                          className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-emerald-400"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT AREA: Video, Text & Quizzes */}
      <main className="flex-1 bg-[#0B0F19] h-screen overflow-y-auto">
        {activeLesson ? (
          <div className="max-w-5xl mx-auto">
            {/* Video Player Section */}
            {activeLesson.video_url ? (
              <div className="aspect-video w-full bg-black border-b border-white/10 relative">
                <iframe
                  src={getEmbedUrl(activeLesson.video_url) || ""}
                  title={activeLesson.title}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-[21/9] w-full bg-slate-900 border-b border-white/10 flex flex-col items-center justify-center text-slate-500">
                <Video className="h-16 w-16 mb-4 opacity-50" />
                <p>No video provided for this lesson.</p>
              </div>
            )}

            {/* Lesson Details Section */}
            <div className="p-8 md:p-12 pb-24">
              <h1 className="text-3xl md:text-4xl font-bold mb-8">
                {activeLesson.title}
              </h1>

              {activeLesson.content ? (
                <div className="prose prose-invert max-w-none prose-indigo prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10 text-slate-300 text-lg">
                  <ReactMarkdown>{activeLesson.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  No written content available for this lesson.
                </p>
              )}

              {/* 🚀 THE QUIZ TAKER INTERFACE */}
              {!quizLoading && quiz && (
                <div className="mt-16 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/10 bg-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BrainCircuit className="h-6 w-6 text-amber-400" />
                      <h2 className="text-xl font-bold text-white">
                        Lesson Assessment
                      </h2>
                    </div>
                    <span className="text-sm font-medium text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-white/5">
                      Required to pass: {quiz.pass_score}%
                    </span>
                  </div>

                  {quizResult ? (
                    // --- QUIZ RESULTS VIEW ---
                    <div className="p-8 flex flex-col items-center text-center">
                      {quizResult.passed ? (
                        <>
                          <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-10 w-10 text-emerald-500" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            You Passed!
                          </h3>
                          <p className="text-slate-400 mb-6">
                            You scored {quizResult.score}% (
                            {quizResult.correctCount} out of{" "}
                            {quizResult.totalQuestions} correct)
                          </p>
                          <button
                            onClick={() => setQuizResult(null)}
                            className="text-emerald-400 hover:text-emerald-300 font-medium text-sm flex items-center gap-2"
                          >
                            <RotateCcw className="h-4 w-4" /> Retake Quiz
                            (Optional)
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="h-10 w-10 text-red-500" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            Not quite there yet.
                          </h3>
                          <p className="text-slate-400 mb-6">
                            You scored {quizResult.score}%, but need{" "}
                            {quizResult.pass_score}% to complete this lesson.
                          </p>
                          <button
                            onClick={() => {
                              setQuizResult(null);
                              setSelectedAnswers({});
                            }}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-500 transition-colors flex items-center gap-2"
                          >
                            <RotateCcw className="h-4 w-4" /> Try Again
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    // --- QUIZ QUESTIONS VIEW ---
                    <div className="p-8 space-y-8">
                      {quiz.questions.map((question, index) => (
                        <div key={question.id} className="space-y-4">
                          <h3 className="text-lg font-medium text-white">
                            <span className="text-indigo-400 mr-2">
                              {index + 1}.
                            </span>
                            {question.text}
                          </h3>
                          <div className="space-y-2 pl-6">
                            {question.options.map((option) => (
                              <label
                                key={option.id}
                                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                                  selectedAnswers[question.id] === option.id
                                    ? "bg-indigo-500/10 border-indigo-500/50 text-white"
                                    : "bg-slate-950 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${question.id}`}
                                  checked={
                                    selectedAnswers[question.id] === option.id
                                  }
                                  onChange={() =>
                                    handleOptionSelect(question.id, option.id)
                                  }
                                  className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-600 focus:ring-indigo-500"
                                />
                                <span>{option.text}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="pt-6 border-t border-white/10 flex justify-end">
                        <button
                          onClick={handleQuizSubmit}
                          disabled={
                            Object.keys(selectedAnswers).length <
                              quiz.questions.length || isSubmittingQuiz
                          }
                          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                          {isSubmittingQuiz ? "Grading..." : "Submit Answers"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 🚀 The dynamic Navigation & Action Bar */}
              <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6">
                {/* Previous Button */}
                <div className="w-full sm:w-1/3 flex justify-start">
                  {previousLesson && (
                    <button
                      onClick={() => setActiveLesson(previousLesson)}
                      className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors font-medium"
                    >
                      <ArrowLeft className="h-4 w-4" /> Previous Lesson
                    </button>
                  )}
                </div>

                {/* Mark as Complete Button (LOCKED IF QUIZ FAILED) */}
                <div className="w-full sm:w-1/3 flex justify-center">
                  {quiz &&
                  !quizResult?.passed &&
                  !completedLessons.includes(activeLesson.id) ? (
                    // LOCKED STATE
                    <button
                      disabled
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                    >
                      <BrainCircuit className="h-5 w-5" /> Pass Quiz to Complete
                    </button>
                  ) : (
                    // NORMAL / COMPLETED STATE
                    <button
                      onClick={() => toggleLessonComplete(activeLesson.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                        completedLessons.includes(activeLesson.id)
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                      }`}
                    >
                      {completedLessons.includes(activeLesson.id) ? (
                        <>
                          <CheckCircle className="h-5 w-5" /> Completed
                        </>
                      ) : (
                        "Mark as Complete"
                      )}
                    </button>
                  )}
                </div>

                {/* Next Button */}
                <div className="w-full sm:w-1/3 flex justify-end">
                  {nextLesson && (
                    <button
                      onClick={() => setActiveLesson(nextLesson)}
                      className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors font-medium"
                    >
                      Next Lesson <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-10 text-center">
            <CheckCircle className="h-16 w-16 mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-slate-300 mb-2">
              You're all caught up!
            </h2>
            <p>Select a lesson from the sidebar to start learning.</p>
          </div>
        )}
      </main>
    </div>
  );
}
