import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/users/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const userData = response.data.data;
        setProfile(userData);
        setFullName(userData.full_name);
        setEmail(userData.email);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:5000/api/users/profile",
        { full_name: fullName, email },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const updatedUser = response.data.data;
      setProfile((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));

      // Update local storage so the navbar reflects the new name/email
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, ...updatedUser }),
      );

      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "Failed to update profile.";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30 pb-20">
      {/* Navbar */}
      <nav className="bg-slate-900/60 backdrop-blur-md border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/20">
              <User className="text-indigo-400 h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Account Settings
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Account Overview Header Card */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
              {profile?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {profile?.full_name}
              </h2>
              <p className="text-slate-400 text-sm">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Shield className="h-3.5 w-3.5" />
              {profile?.role}
            </span>
            {profile?.created_at && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500 px-3 py-1.5 rounded-full bg-slate-950 border border-white/5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Edit Profile Form Card */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white mb-1">
            Personal Details
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Update your public profile display name and account email address.
          </p>

          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
