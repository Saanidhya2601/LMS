import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  BookOpen,
  CheckCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    total_courses: number;
    total_enrollments: number;
    total_completions: number;
    overall_avg_progress: number;
  };
  course_breakdown: Array<{
    id: string;
    title: string;
    status: string;
    enrollments: number;
    completions: number;
    avg_progress: number;
  }>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/instructor/analytics",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setData(response.data.data);
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-indigo-400 gap-4">
        <BarChart3 className="h-8 w-8 animate-pulse" />
        <p>Crunching the numbers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30 pb-20">
      {/* Navbar */}
      <nav className="bg-slate-900/60 backdrop-blur-md border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/20">
              <BarChart3 className="text-indigo-400 h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Instructor Analytics
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* 🚀 TOP METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Card 1: Total Students */}
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 font-medium">Total Students</span>
              <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <span className="text-3xl font-bold text-white">
              {data?.overview.total_enrollments || 0}
            </span>
          </div>

          {/* Card 2: Avg Progress */}
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 font-medium">
                Avg. Completion
              </span>
              <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <span className="text-3xl font-bold text-white">
              {data?.overview.overall_avg_progress || 0}%
            </span>
          </div>

          {/* Card 3: Total Completions */}
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col hover:border-emerald-500/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 font-medium">
                Course Finishes
              </span>
              <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <span className="text-3xl font-bold text-white">
              {data?.overview.total_completions || 0}
            </span>
          </div>

          {/* Card 4: Total Courses */}
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl flex flex-col hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 font-medium">Active Courses</span>
              <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <span className="text-3xl font-bold text-white">
              {data?.overview.total_courses || 0}
            </span>
          </div>
        </div>

        {/* 🚀 DETAILED COURSE BREAKDOWN */}
        <h2 className="text-xl font-bold text-white mb-6">Course Breakdown</h2>
        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-white/10 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-5 font-medium">Course Title</th>
                  <th className="p-5 font-medium">Status</th>
                  <th className="p-5 font-medium">Students</th>
                  <th className="p-5 font-medium">Completions</th>
                  <th className="p-5 font-medium min-w-[200px]">
                    Avg Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.course_breakdown.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-5 font-medium text-white">
                      {course.title}
                    </td>
                    <td className="p-5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border ${
                          course.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="p-5 font-medium text-slate-300">
                      {course.enrollments}
                    </td>
                    <td className="p-5 font-medium text-slate-300">
                      {course.completions}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-indigo-400 w-10">
                          {course.avg_progress}%
                        </span>
                        <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${course.avg_progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.course_breakdown.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500">
                      No courses found. Go create your first one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
