import { useState } from "react";
import { API_BASE } from "../config";

export default function Login({ onLoginSuccess, onToggleRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication failed.");
      }

      const data = await response.json();
      onLoginSuccess(data.access_token);
    } catch (err) {
      setError(err.message || "Failed to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 animate-fadeIn">
      {/* Brand Icon & Heading */}
      <div className="text-center mb-8">
        <div className="inline-block bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-3.5 rounded-2xl text-white shadow-xl shadow-violet-600/20 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Welcome Back</h2>
        <p className="text-slate-400 text-sm mt-1.5 font-medium">
          Sign in to the Customised Gift Tracker
        </p>
      </div>

      {/* Glassmorphism Login Card */}
      <div className="bg-[#0b1021]/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-violet-950/10 relative overflow-hidden">
        
        {/* Decorative subtle background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5">
            <span className="text-sm leading-none">&#9888;&#65039;</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. you@example.com"
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-850/80 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-850/80 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl py-3.5 text-xs tracking-wide uppercase transition shadow-lg shadow-violet-600/25 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying Credentials...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 mb-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800/60" />
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">New here?</span>
          <div className="flex-1 h-px bg-slate-800/60" />
        </div>

        {/* Register Options */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          <button
            id="register-client-btn"
            onClick={() => onToggleRegister("client")}
            disabled={loading}
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-violet-600/10 hover:border-violet-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-white block">Client Account</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Order & Track Gifts</span>
            </div>
          </button>

          <button
            id="register-staff-btn"
            onClick={() => onToggleRegister("staff")}
            disabled={loading}
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-violet-600/10 hover:border-violet-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-white block">Staff Account</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Manage & Fulfill</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
