import { useState } from "react";
import { API_BASE } from "../config";

export default function Register({ role = "client", onRegisterSuccess, onToggleLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isClient = role === "client";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role: role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed.");
      }

      setSuccess(true);
      // Wait briefly before switching to login
      setTimeout(() => {
        onRegisterSuccess();
      }, 2000);
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
        <div className={`inline-block p-3.5 rounded-2xl text-white shadow-xl mb-4 ${
          isClient 
            ? "bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-600/20" 
            : "bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-violet-600/20"
        }`}>
          {isClient ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          {isClient ? "Create Client Account" : "Join the Studio"}
        </h2>
        <p className="text-slate-400 text-sm mt-1.5 font-medium">
          {isClient
            ? "Register to order & track your custom gifts"
            : "Create your Customised Gift Tracker Staff Account"}
        </p>
      </div>

      {/* Glassmorphism Register Card */}
      <div className="bg-[#0b1021]/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-violet-950/10 relative overflow-hidden">
        
        {/* Decorative subtle background glow */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isClient ? "bg-emerald-600/10" : "bg-violet-600/10"
        }`} />
        <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isClient ? "bg-teal-600/10" : "bg-fuchsia-600/10"
        }`} />

        {/* Role Badge */}
        <div className="flex justify-center mb-5 relative z-10">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isClient 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {isClient ? "Client Registration" : "Staff Registration"}
          </span>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5">
            <span className="text-sm leading-none">&#9888;&#65039;</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5">
            <span className="text-sm leading-none">&#10003;</span>
            <span>Registration successful! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              id="register-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isClient ? "e.g. John Doe" : "e.g. Gwen Stacy"}
              disabled={loading || success}
              className="w-full bg-slate-950 border border-slate-850/80 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isClient ? "e.g. john@gmail.com" : "e.g. gwen@gifttracker.com"}
              disabled={loading || success}
              className="w-full bg-slate-950 border border-slate-850/80 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              disabled={loading || success}
              className="w-full bg-slate-950 border border-slate-850/80 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              disabled={loading || success}
              className="w-full bg-slate-950 border border-slate-850/80 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading || success}
            className={`w-full text-white font-bold rounded-xl py-3.5 text-xs tracking-wide uppercase transition shadow-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              isClient
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-600/25 focus:ring-emerald-500"
                : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-violet-600/25 focus:ring-violet-500"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </span>
            ) : (
              `Create ${isClient ? "Client" : "Staff"} Account`
            )}
          </button>
        </form>

        {/* Toggle link */}
        <div className="mt-6 text-center border-t border-slate-800/60 pt-4 text-xs text-slate-400">
          Already have an account?{" "}
          <button
            id="back-to-login-btn"
            onClick={onToggleLogin}
            disabled={loading || success}
            className="text-violet-400 hover:text-violet-300 font-bold hover:underline cursor-pointer transition disabled:opacity-50"
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
}
