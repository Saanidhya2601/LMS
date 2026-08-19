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
} from "lucide-react";
import axios from "axios";

// Added Module and Lesson interfaces
interface Lesson {
  id: string;
  title: string;
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
  modules?: Module[]; // Course now includes modules!
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

  // Curriculum State
  const [modules, setModules] = useState<Module[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);

  // Settings Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft",
    level: "Beginner",
  });

  // Fetch the course AND its modules
  useEffect(() => {
    const fetchCourse = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        // 🚀 We are now using the NEW backend route!
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

  // Handle updating Course Settings
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

  // 🚀 NEW: Handle creating a Module
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;

    setIsCreatingModule(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/modules`,
        {
          title: newModuleTitle,
          order: modules.length + 1, // Put it at the end of the list
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Add the new module to the screen instantly
      setModules([...modules, response.data.data]);
      setNewModuleTitle(""); // Clear the input box
    } catch (error) {
      console.error("Failed to create module:", error);
      alert("Failed to create module.");
    } finally {
      setIsCreatingModule(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 flex flex-col">
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
        {/* 🚀 TAB 1: CURRICULUM */}
        {activeTab === "curriculum" && (
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Curriculum Builder</h1>
            <p className="text-slate-400 mb-8">
              Design your course structure by adding modules and lessons.
            </p>

            {/* Display Existing Modules */}
            <div className="space-y-4 mb-8">
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
                    className="bg-slate-900 border border-white/10 rounded-xl p-5 flex items-center justify-between group"
                  >
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
                    {/* Add Lesson Button (Placeholder for Phase 2) */}
                    <button className="text-sm bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg transition-colors border border-white/5">
                      + Add Lesson
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Create New Module Form */}
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

        {/* TAB 2: SETTINGS (Unchanged from before) */}
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
                  className={`p-3 rounded-lg text-sm font-medium text-center border ${
                    message.type === "success"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
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

        {/* TAB 3: STUDENTS */}
        {activeTab === "students" && (
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Enrolled Students</h1>
            <p className="text-slate-400 mb-8">
              View and manage the students taking this course.
            </p>
            <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl text-center text-slate-500">
              Student data table coming up later!
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
