import { useState } from "react";
import axios from "axios";
import { Lock, Mail } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        },
      );

      const token = response.data.token;
      localStorage.setItem("lms_token", token);

      // Redirect to the dashboard instantly on success
      navigate("/dashboard");
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
          "Login failed. Check your credentials.",
      );
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 relative flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your LMS dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-5">
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
                placeholder="teacher@lms.com"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-6 w-full p-4 rounded-lg text-sm font-medium text-center ${isError ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}
          >
            {message}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
