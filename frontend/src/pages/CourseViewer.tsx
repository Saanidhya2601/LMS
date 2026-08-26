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
} from "lucide-react";
import axios from "axios";

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

export default function CourseViewer() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // 🚀 New State: Tracks completed lessons
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // 1. Fetch the course data
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
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const foundCourse = response.data.data;
        setCourse(foundCourse);

        // Auto-select the very first lesson when they enter the classroom!
        if (foundCourse?.modules?.[0]?.lessons?.[0]) {
          setActiveLesson(foundCourse.modules[0].lessons[0]);
        }
      } catch (error) {
        console.error("Failed to load classroom:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, navigate]);

  // 🚀 2. Fetch the student's progress
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

  // 🚀 3. Function to toggle lesson completion
  const toggleLessonComplete = async (lessonId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/lessons/${lessonId}/progress`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.completed) {
        // Add it to the array of completed lessons
        setCompletedLessons((prev) => [...prev, lessonId]);
      } else {
        // Remove it from the array
        setCompletedLessons((prev) => prev.filter((id) => id !== lessonId));
      }
    } catch (error) {
      console.error("Failed to update progress", error);
    }
  };

  // Helper to extract a clean YouTube embed link if they provided one
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const videoIdMatch = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?]*)/,
    );
    return videoIdMatch
      ? `https://www.youtube.com/embed/${videoIdMatch[1]}`
      : url;
  };

  // 🚀 Flatten all lessons into a single ordered array for navigation
  const allLessons = course?.modules?.flatMap((m) => m.lessons) || [];

  // 🚀 Find the current index to determine previous and next lessons
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
                  const isCompleted = completedLessons.includes(lesson.id); // Check completion

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors
                         ${
                           isActive
                             ? "bg-indigo-600 text-white shadow-lg"
                             : "hover:bg-white/5 text-slate-300"
                         }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {lesson.video_url ? (
                          <PlayCircle
                            className={`h-4 w-4 ${
                              isActive ? "text-white" : "text-indigo-400"
                            }`}
                          />
                        ) : (
                          <FileText
                            className={`h-4 w-4 ${
                              isActive ? "text-white" : "text-indigo-400"
                            }`}
                          />
                        )}
                      </div>

                      <span className="text-sm font-medium leading-snug flex-1 pr-2">
                        {lIndex + 1}. {lesson.title}
                      </span>

                      {/* 🚀 Sidebar visual checkmark for completed lessons */}
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

      {/* MAIN CONTENT AREA: Video & Text Viewer */}
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

                {/* Mark as Complete Button */}
                <div className="w-full sm:w-1/3 flex justify-center">
                  <button
                    onClick={() => toggleLessonComplete(activeLesson.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors duration-200 ${
                      completedLessons.includes(activeLesson.id)
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
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
