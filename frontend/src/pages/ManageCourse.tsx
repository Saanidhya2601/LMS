import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Settings, Users, ArrowLeft, X } from "lucide-react";
import axios from "axios";

// 🚀 Import our newly sliced components!
import CurriculumTab from "../components/CurriculumTab";
import SettingsTab from "../components/SettingsTab";
import StudentsTab from "../components/StudentsTab";

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
  lessons?: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  level: string;
  modules?: Module[];
}

interface EnrolledStudent {
  id: string;
  created_at?: string;
  user: {
    full_name: string;
    email: string;
  };
}

export default function ManageCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "curriculum" | "settings" | "students"
  >("curriculum");

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft",
    level: "Beginner",
  });

  // Curriculum State
  const [modules, setModules] = useState<Module[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);

  // Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    content: "",
    video_url: "",
  });

  // Students State
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

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
        if (foundCourse) {
          setCourse(foundCourse);
          setModules(foundCourse.modules || []);
          setFormData({
            title: foundCourse.title,
            description: foundCourse.description,
            category: foundCourse.category,
            status: foundCourse.status,
            level: foundCourse.level || "Beginner",
          });
        }
      } catch (error) {
        console.error("Failed to fetch course:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, navigate]);

  useEffect(() => {
    if (activeTab === "students" && courseId) {
      const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `http://localhost:5000/api/courses/${courseId}/students`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          setStudents(response.data.data);
        } catch (error) {
          console.error("Failed to fetch students", error);
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchStudents();
    }
  }, [activeTab, courseId]);

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/courses/${courseId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage({ text: "Course updated successfully!", type: "success" });
      setCourse(response.data.data);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      setMessage({
        text: "Failed to save changes. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    setIsCreatingModule(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/modules`,
        { title: newModuleTitle, order: modules.length + 1 },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setModules([...modules, { ...response.data.data, lessons: [] }]);
      setNewModuleTitle("");
    } catch (error) {
      alert("Failed to create module.");
    } finally {
      setIsCreatingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this module and all of its lessons? This cannot be undone.",
    );
    if (!isConfirmed) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/modules/${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModules(modules.filter((mod) => mod.id !== moduleId));
    } catch (error) {
      alert("Failed to delete module.");
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModuleId) return;
    setIsCreatingLesson(true);
    try {
      const token = localStorage.getItem("token");
      const parentModule = modules.find((m) => m.id === activeModuleId);
      const nextOrder = (parentModule?.lessons?.length || 0) + 1;
      const response = await axios.post(
        `http://localhost:5000/api/modules/${activeModuleId}/lessons`,
        { ...lessonFormData, order: nextOrder },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setModules(
        modules.map((mod) => {
          if (mod.id === activeModuleId) {
            return {
              ...mod,
              lessons: [...(mod.lessons || []), response.data.data],
            };
          }
          return mod;
        }),
      );
      setIsLessonModalOpen(false);
      setLessonFormData({ title: "", content: "", video_url: "" });
      setActiveModuleId(null);
    } catch (error) {
      alert("Failed to create lesson.");
    } finally {
      setIsCreatingLesson(false);
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this lesson?",
    );
    if (!isConfirmed) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModules(
        modules.map((mod) => {
          if (mod.id === moduleId) {
            return {
              ...mod,
              lessons: mod.lessons?.filter((lesson) => lesson.id !== lessonId),
            };
          }
          return mod;
        }),
      );
    } catch (error) {
      alert("Failed to delete lesson.");
    }
  };

  const openLessonModal = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setIsLessonModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex relative">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 flex flex-col z-10 shrink-0">
        <div className="p-6 border-b border-white/10">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h2 className="text-xl font-bold truncate">
            {course?.title || "Course Workspace"}
          </h2>
          <span
            className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border ${
              course?.status === "published"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {course?.status}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === "curriculum" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"}`}
          >
            <BookOpen className="h-5 w-5" /> Curriculum
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === "settings" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"}`}
          >
            <Settings className="h-5 w-5" /> Settings
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === "students" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"}`}
          >
            <Users className="h-5 w-5" /> Students
          </button>
        </nav>
      </aside>

      {/* 🚀 MAIN CONTENT AREA: Look how incredibly clean this is now! */}
      <main className="flex-1 p-10 overflow-y-auto">
        {activeTab === "curriculum" && (
          <CurriculumTab
            modules={modules}
            newModuleTitle={newModuleTitle}
            setNewModuleTitle={setNewModuleTitle}
            isCreatingModule={isCreatingModule}
            handleCreateModule={handleCreateModule}
            handleDeleteModule={handleDeleteModule}
            openLessonModal={openLessonModal}
            handleDeleteLesson={handleDeleteLesson}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            formData={formData}
            setFormData={setFormData}
            handleUpdateCourse={handleUpdateCourse}
            isSaving={isSaving}
            message={message}
          />
        )}

        {activeTab === "students" && (
          <StudentsTab students={students} loadingStudents={loadingStudents} />
        )}
      </main>

      {/* Lesson Creation Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Add New Lesson</h2>
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLesson} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Lesson Title
                </label>
                <input
                  type="text"
                  required
                  value={lessonFormData.title}
                  onChange={(e) =>
                    setLessonFormData({
                      ...lessonFormData,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Understanding React Hooks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Video URL (Optional)
                </label>
                <input
                  type="url"
                  value={lessonFormData.video_url}
                  onChange={(e) =>
                    setLessonFormData({
                      ...lessonFormData,
                      video_url: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Lesson Content (Optional)
                </label>
                <textarea
                  rows={5}
                  value={lessonFormData.content}
                  onChange={(e) =>
                    setLessonFormData({
                      ...lessonFormData,
                      content: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Write the lesson notes or content here..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingLesson}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isCreatingLesson ? "Saving..." : "Save Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
