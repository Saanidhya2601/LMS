import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, Settings, Users, ArrowLeft, Save } from "lucide-react";
import axios from "axios";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  level: string;
}

export default function ManageCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "curriculum" | "settings" | "students"
  >("settings");

  // State for the course data
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Form state for editing
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft",
    level: "Beginner",
  });

  // Fetch the course data when the page loads
  useEffect(() => {
    const fetchCourse = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        // For now, we fetch all courses and find the one we clicked on
        const response = await axios.get("http://localhost:5000/api/courses", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const foundCourse = response.data.data.find(
          (c: Course) => c.id === courseId,
        );

        if (foundCourse) {
          setCourse(foundCourse);
          setFormData({
            title: foundCourse.title,
            description: foundCourse.description,
            category: foundCourse.category,
            status: foundCourse.status,
            level: foundCourse.level || "Beginner",
          });
        } else {
          navigate("/dashboard"); // Course not found, kick them back
        }
      } catch (error) {
        console.error("Failed to fetch course:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, navigate]);

  // Handle updating the course
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
      setCourse(response.data.data); // Update local state with new data

      // Clear success message after 3 seconds
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Failed to update course:", error);
      setMessage({
        text: "Failed to save changes. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
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
      {/* Left Sidebar Navigation */}
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
        {/* TAB 1: CURRICULUM */}
        {activeTab === "curriculum" && (
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Curriculum Builder</h1>
            <p className="text-slate-400 mb-8">
              Design your course structure by adding modules and lessons.
            </p>
            <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl text-center text-slate-500">
              We will build the Module and Lesson creator here next!
            </div>
          </div>
        )}

        {/* TAB 2: SETTINGS (Now fully functional!) */}
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

              {/* Success / Error Messages */}
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
