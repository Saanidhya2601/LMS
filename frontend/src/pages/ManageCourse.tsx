import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Settings,
  Users,
  ArrowLeft,
  Save,
  Plus,
  GripVertical,
  FileText,
  Video,
  X,
  Trash2,
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

// 🚀 NEW: Interface for our student data
interface EnrolledStudent {
  id: string;
  created_at?: string;
  // 🚀 THE FIX: Changed 'users' to 'user'
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
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [modules, setModules] = useState<Module[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    content: "",
    video_url: "",
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft",
    level: "Beginner",
  });

  // 🚀 NEW: State for students
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

  // 🚀 NEW: Fetch students ONLY when the Instructor clicks the "Students" tab
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
      console.error("Failed to create module:", error);
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
      console.error("Failed to delete module:", error);
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
      console.error("Failed to create lesson:", error);
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
      console.error("Failed to delete lesson:", error);
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
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 flex flex-col z-10">
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === "curriculum"
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <BookOpen className="h-5 w-5" /> Curriculum
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === "settings"
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Settings className="h-5 w-5" /> Settings
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === "students"
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Users className="h-5 w-5" /> Students
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* TAB 1: CURRICULUM */}
        {activeTab === "curriculum" && (
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Curriculum Builder</h1>
            <p className="text-slate-400 mb-8">
              Design your course structure by adding modules and lessons.
            </p>

            <div className="space-y-6 mb-8">
              {modules.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl text-center">
                  <p className="text-slate-500">
                    Your curriculum is empty. Add a module to get started!
                  </p>
                </div>
              ) : (
                modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="bg-slate-900/80 border border-white/10 rounded-xl overflow-hidden group"
                  >
                    <div className="p-5 flex items-center justify-between bg-slate-900 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <GripVertical className="h-5 w-5 text-slate-600 cursor-grab hover:text-slate-400" />
                        <div>
                          <span className="text-xs font-bold text-indigo-400 mb-1 block">
                            Module {index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-white">
                            {module.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openLessonModal(module.id)}
                          className="text-sm bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg transition-colors border border-white/5 flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" /> Add Lesson
                        </button>
                        <button
                          onClick={() => handleDeleteModule(module.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Module"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      {!module.lessons || module.lessons.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No lessons yet.
                        </p>
                      ) : (
                        module.lessons.map((lesson, lIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-4 bg-slate-950 p-4 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                          >
                            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                              {lIndex + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-slate-200">
                                {lesson.title}
                              </h4>
                            </div>

                            <div className="flex gap-3 items-center border-l border-white/5 pl-4">
                              <div className="flex gap-2">
                                {lesson.video_url && (
                                  <Video
                                    className="h-4 w-4 text-slate-500"
                                    title="Has Video"
                                  />
                                )}
                                {lesson.content && (
                                  <FileText
                                    className="h-4 w-4 text-slate-500"
                                    title="Has Text Content"
                                  />
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  handleDeleteLesson(module.id, lesson.id)
                                }
                                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                title="Delete Lesson"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleCreateModule}
              className="bg-slate-900/50 border border-white/10 p-6 rounded-2xl"
            >
              <h3 className="text-lg font-semibold mb-4">Add New Module</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  required
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="e.g., Section 1: Introduction to React"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isCreatingModule}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  <Plus className="h-5 w-5" />
                  {isCreatingModule ? "Adding..." : "Add Module"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: SETTINGS */}
        {activeTab === "settings" && (
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">Course Settings</h1>
            <p className="text-slate-400 mb-8">
              Update your course details and publish status.
            </p>

            <form
              onSubmit={handleUpdateCourse}
              className="space-y-6 bg-slate-900/50 border border-white/10 p-6 rounded-2xl"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-950 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {message.text && (
                <div
                  className={`p-3 rounded-lg text-sm font-medium text-center border ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
                >
                  {message.text}
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 🚀 UPGRADED TAB 3: STUDENTS */}
        {activeTab === "students" && (
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Enrolled Students</h1>
            <p className="text-slate-400 mb-8">
              View and manage the students taking this course.
            </p>

            <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
              {loadingStudents ? (
                <div className="p-10 text-center text-slate-500 animate-pulse">
                  Loading student data...
                </div>
              ) : students.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl text-center text-slate-500 bg-slate-900/50 m-4">
                  No students have enrolled in this course yet.
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4">Enrollment Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {students.map((enrollment) => (
                      <tr
                        key={enrollment.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                            {enrollment.user.full_name.charAt(0).toUpperCase()}
                          </div>
                          {enrollment.user.full_name}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {enrollment.user.email}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {enrollment.created_at
                            ? new Date(
                                enrollment.created_at,
                              ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
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
