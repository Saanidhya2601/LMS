import React, { useState } from "react";
import { Lock, Mail, User, GraduationCap, Presentation } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DotField from "../components/DotField";
import ParticleText from "../components/ParticleText";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 🚀 NEW: State to track which role the user selects!
  const [role, setRole] = useState<"student" | "instructor">("student");

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (password !== confirmPassword) {
      setMessage("Passwords don't match.");
      setIsError(true);
      return;
    }

    setLoading(true);
    try {
      // 1. Create the Account (Now sending the selected role!)
      const registerResponse = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: name,
            email,
            password,
            role: role, // Dynamic role!
          }),
        },
      );

      let registerData: { message?: string } = {};
      try {
        registerData = await registerResponse.json();
      } catch {}

      if (!registerResponse.ok) {
        setMessage(
          registerData.message ||
            "Couldn't create your account. Check your details and try again.",
        );
        setIsError(true);
        setLoading(false);
        return;
      }

      // 2. Account created! Auto-login behind the scenes
      setMessage(`Account created! Logging you in as an ${role}...`);
      setIsError(false);

      const loginResponse = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      let loginData: { token?: string; user?: any } = {};
      try {
        loginData = await loginResponse.json();
      } catch {}

      if (loginResponse.ok && loginData.token && loginData.user) {
        // THE VAULT
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("user", JSON.stringify(loginData.user));

        setMessage("Welcome! Loading your dashboard...");

        // 3. Teleport to the Dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        setMessage("Account created successfully. Please sign in.");
        setLoading(false);
      }
    } catch {
      setMessage("Couldn't reach the server. Is your backend running?");
      setIsError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0">
        <DotField />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center px-4 mt-12 mb-12">
        <div className="w-full max-w-5xl h-32 mb-8">
          <ParticleText
            text="Create Account"
            fontSize="clamp(2.75rem, 8vw, 6.5rem)"
          />
        </div>

        <div className="w-full max-w-md flex flex-col items-center">
          <form onSubmit={handleSignup} className="w-full space-y-5">
            {/* 🚀 NEW: Role Selector UI */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300 border ${
                  role === "student"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                    : "bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                <GraduationCap className="h-5 w-5" />
                Student
              </button>

              <button
                type="button"
                onClick={() => setRole("instructor")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300 border ${
                  role === "instructor"
                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                <Presentation className="h-5 w-5" />
                Instructor
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 text-white placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 text-white placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 text-white placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 text-white placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg ${
                role === "instructor"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading
                ? "Creating account..."
                : `Register as ${role === "instructor" ? "Instructor" : "Student"}`}
            </button>
          </form>

          {message && (
            <div
              className={`mt-6 w-full p-4 rounded-lg text-sm font-medium text-center ${
                isError
                  ? "bg-red-500/10 text-red-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {message}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
