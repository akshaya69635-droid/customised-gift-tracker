import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import OrderForm from "./components/OrderForm";
import OrderDetailView from "./components/OrderDetailView";
import ClientDashboard from "./components/ClientDashboard";
import Login from "./components/Login";
import Register from "./components/Register";
import { API_BASE } from "./config";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authView, setAuthView] = useState("login"); // "login" or "register"
  const [registerRole, setRegisterRole] = useState("client"); // "client" or "staff"
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard" or "create"
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [prefillData, setPrefillData] = useState(null);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setSelectedOrderId(null);
    setActiveView("dashboard");
  };

  useEffect(() => {
    if (token) {
      const fetchProfile = async () => {
        try {
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error("Invalid session");
          }
          const userData = await response.json();
          setUser(userData);
        } catch (err) {
          console.error("fetchProfile failed:", err);
          handleLogout();
        }
      };
      fetchProfile();
    }
  }, [token]);

  const handleOrderCreated = (newOrder) => {
    setActiveView("dashboard");
    setSelectedOrderId(newOrder.id);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOrderUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Unauthenticated Layout
  if (!token) {
    return (
      <div className="min-h-screen bg-[#090D1A] text-slate-100 font-sans antialiased flex flex-col justify-between selection:bg-violet-500/30 selection:text-violet-200">
        {/* Company Name Top Bar */}
        <div className="bg-gradient-to-r from-violet-950/80 via-fuchsia-950/60 to-violet-950/80 border-b border-violet-500/10">
          <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="text-sm font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-300">PAPER PLANE</span>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">— Personalized Gifting Company</span>
          </div>
        </div>

        <header className="border-b border-slate-800/80 bg-[#090D1A]/85 backdrop-blur-md h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-2 rounded-xl text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight">Customised Gift Tracker</span>
              <span className="text-slate-500 text-xs block -mt-1 font-mono">Gift Studio</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          {authView === "login" ? (
            <Login
              onLoginSuccess={handleLoginSuccess}
              onToggleRegister={(role) => {
                setRegisterRole(role || "client");
                setAuthView("register");
              }}
            />
          ) : (
            <Register
              role={registerRole}
              onRegisterSuccess={() => setAuthView("login")}
              onToggleLogin={() => setAuthView("login")}
            />
          )}
        </main>

        <footer className="border-t border-slate-800/60 py-6 bg-slate-950/20 text-center text-xs text-slate-500">
          <p>© 2026 Customised Gift Tracker. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // Authenticated Layout
  return (
    <div className="min-h-screen bg-[#090D1A] text-slate-100 font-sans antialiased selection:bg-violet-500/30 selection:text-violet-200">
      
      {/* Company Name Top Bar */}
      <div className="bg-gradient-to-r from-violet-950/80 via-fuchsia-950/60 to-violet-950/80 border-b border-violet-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span className="text-sm font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-300">PAPER PLANE</span>
          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">— Personalized Gifting Company</span>
        </div>
      </div>

      {/* Brand Header */}
      <header className="sticky top-0 z-40 bg-[#090D1A]/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-2 rounded-xl text-white shadow-md shadow-violet-500/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight">Customised Gift Tracker</span>
              <span className="text-slate-500 text-xs block -mt-1 font-mono">
                {user?.role === "client" ? "Client Hub" : "Gift Studio"}
              </span>
            </div>
          </div>

          {/* Navigation Links & Profile */}
          <div className="flex items-center gap-4">
            <nav className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-xl gap-1">
              <button
                onClick={() => {
                  setActiveView("dashboard");
                  setSelectedOrderId(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeView === "dashboard" && !selectedOrderId
                    ? "bg-slate-800 text-white shadow-inner"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {user?.role === "client" ? "📋 My Orders" : "📊 Pipeline Board"}
              </button>
              <button
                onClick={() => {
                  setActiveView("create");
                  setSelectedOrderId(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeView === "create"
                    ? "bg-slate-800 text-white shadow-inner"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ✍️ Submit Request
              </button>
            </nav>

            <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
              {user && (
                <div className="hidden sm:block text-right">
                  <span className="text-white text-xs font-bold block">{user.full_name || user.email}</span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {user.role === "client" ? "Registered Client" : "Staff Assignee"}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-slate-905 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {selectedOrderId ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Context breadcrumb to go back */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button 
                onClick={() => setSelectedOrderId(null)} 
                className="hover:text-slate-300 font-semibold transition cursor-pointer"
              >
                Dashboard
              </button>
              <span>/</span>
              <span className="text-slate-400 font-mono">Order #{selectedOrderId}</span>
            </div>
            
            <OrderDetailView
              orderId={selectedOrderId}
              token={token}
              user={user}
              onClose={() => setSelectedOrderId(null)}
              onOrderUpdated={handleOrderUpdated}
              onUnauthorized={handleLogout}
            />
          </div>
        ) : activeView === "create" ? (
          <div className="animate-fadeIn">
            <OrderForm 
              token={token} 
              user={user}
              prefillData={prefillData}
              onOrderCreated={handleOrderCreated} 
              onUnauthorized={handleLogout}
            />
          </div>
        ) : user?.role === "client" ? (
          <div className="animate-fadeIn">
            <ClientDashboard
              token={token}
              user={user}
              onSelectOrder={setSelectedOrderId}
              onCreateNewOrder={(prefill) => {
                setPrefillData(prefill || null);
                setActiveView("create");
              }}
              refreshTrigger={refreshTrigger}
              onUnauthorized={handleLogout}
            />
          </div>
        ) : (
          <div className="animate-fadeIn">
            <Dashboard
              token={token}
              onSelectOrder={setSelectedOrderId}
              onCreateNewOrder={(prefill) => {
                setPrefillData(prefill || null);
                setActiveView("create");
              }}
              refreshTrigger={refreshTrigger}
              onUnauthorized={handleLogout}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 mt-16 py-8 bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
          <p>© 2026 Customised Gift Tracker. All rights reserved.</p>
          <p className="font-mono text-[10px]">Reference Prototype | FastAPI / React / Tailwind CSS v4</p>
        </div>
      </footer>
    </div>
  );
}
