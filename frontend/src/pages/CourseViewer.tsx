import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">
        Loading Classroom...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden">
      {/* 🚀 LEFT SIDEBAR: Course Curriculum */}
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
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "hover:bg-white/5 text-slate-300"
                      }`}
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
                      <span className="text-sm font-medium leading-snug">
                        {lIndex + 1}. {lesson.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT AREA: Video & Text Viewer */}
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
            <div className="p-8 md:p-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-8">
                {activeLesson.title}
              </h1>

              {activeLesson.content ? (
                <div className="prose prose-invert max-w-none prose-indigo prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10">
                  {/* For now, simply rendering the text. Later you can add a Markdown parser here! */}
                  <p className="whitespace-pre-wrap text-slate-300 text-lg leading-loose">
                    {activeLesson.content}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  No written content available for this lesson.
                </p>
              )}
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
