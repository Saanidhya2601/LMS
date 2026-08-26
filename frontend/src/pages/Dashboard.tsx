import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BookOpen, LogOut, Plus, X, Trash2, UserPlus } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  users?: { full_name: string }; // Instructor's name
}

export default function Dashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const navigate = useNavigate();

  // Get the logged-in user to figure out their role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isInstructor = user.role === "instructor";

  // Modal & Form State (Only used by instructors)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft",
    level: "Beginner",
  });

  useEffect(() => {
    const fetchCourses = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      try {
        const response = await axios.get("http://localhost:5000/api/courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(response.data.data);
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      }
    };
    fetchCourses();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/courses",
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setCourses([response.data.data, ...courses]);
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "",
        status: "draft",
        level: "Beginner",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this course? This cannot be undone.",
    );
    if (!isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(courses.filter((course) => course.id !== courseId));
    } catch (error) {
      console.error("Failed to delete course:", error);
      alert("Failed to delete the course.");
    }
  };

  // Handle Student Enrollment
  const handleEnroll = async (courseId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/courses/${courseId}/enroll`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      navigate(`/learn/${courseId}`);
    } catch (error: any) {
      if (error.response?.status === 400) {
        navigate(`/learn/${courseId}`);
      } else {
        alert("Failed to access course. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30">
      <nav className="bg-slate-900/60 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/20">
            <BookOpen className="text-indigo-400 h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            LMS Dashboard
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-slate-400 hidden sm:block">
            Welcome, <span className="text-white">{user.full_name}</span>
            <span className="ml-2 text-[10px] bg-slate-800 px-2 py-1 rounded-full uppercase tracking-wider">
              {user.role}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors duration-150 font-medium text-sm bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-lg border border-transparent hover:border-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isInstructor ? "My Courses" : "Explore Courses"}
            </h1>
            <p className="text-slate-500">
              {isInstructor
                ? "Manage and track your curriculum"
                : "Find your next great thing to learn"}
            </p>
          </div>

          {/* Only Instructors get the Create button */}
          {isInstructor && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-500 transition-colors duration-200 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.6)]"
            >
              <Plus className="h-5 w-5" />
              Create Course
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.length === 0 ? (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center">
              <BookOpen className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg">
                {isInstructor
                  ? "No courses found. Time to create your first one!"
                  : "No courses are currently available."}
              </p>
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="group bg-slate-900 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-colors duration-200 hover:shadow-[0_0_30px_rgba(79,70,229,0.15)] flex flex-col"
              >
                <div className="h-40 bg-slate-950 flex items-center justify-center border-b border-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <BookOpen className="h-10 w-10 text-slate-800 group-hover:text-indigo-500/40 transition-colors duration-200 relative z-10" />

                  {/* Only Instructors get the Delete button */}
                  {isInstructor && (
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="absolute top-3 right-3 p-2 bg-slate-900/80 text-slate-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-150 z-20 opacity-0 group-hover:opacity-100 border border-white/10 hover:border-red-500"
                      title="Delete Course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                      {course.category}
                    </span>

                    {/* Status / Instructor metadata */}
                    {isInstructor ? (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border ${
                          course.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {course.status}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                        By {course.users?.full_name || "Instructor"}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 leading-snug group-hover:text-indigo-300 transition-colors duration-150">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-6 flex-1 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="pt-4 border-t border-white/5 mt-auto">
                    {isInstructor ? (
                      <button
                        onClick={() => navigate(`/manage-course/${course.id}`)}
                        className="w-full text-center text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-150 py-2.5 bg-white/5 rounded-lg hover:bg-white/10"
                      >
                        Manage Course
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="w-full flex justify-center items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-white transition-colors duration-150 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500 hover:border-indigo-500 shadow-sm"
                      >
                        <UserPlus className="h-4 w-4" /> Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Instructor's Create Modal Overlay */}
      {isModalOpen && isInstructor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                Create New Course
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors duration-150 p-1 rounded-md hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-5">
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
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors duration-150"
                  placeholder="e.g., Advanced React Patterns"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors duration-150 resize-none"
                  placeholder="What will students learn?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors duration-150"
                    placeholder="e.g., Programming"
                  />
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
                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors duration-150 appearance-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                  {error}
                </div>
              )}
              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg font-medium transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors duration-150"
                >
                  {isSubmitting ? "Saving..." : "Save Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
