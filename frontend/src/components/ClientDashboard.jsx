import { useState, useEffect } from "react";
import { API_BASE } from "../config";

export default function ClientDashboard({ onSelectOrder, onCreateNewOrder, refreshTrigger, token, onUnauthorized, user }) {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [returns, setReturns] = useState([]);

  // Stats for metrics
  const [stats, setStats] = useState({
    total: 0,
    design: 0,
    production: 0,
    delivery: 0,
    actionRequired: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [newOccasion, setNewOccasion] = useState({ occasion_name: "", recipient_name: "", date: "" });
  const [occasionSubmitting, setOccasionSubmitting] = useState(false);
  const [occasionSuccess, setOccasionSuccess] = useState(false);

  const [newEnquiry, setNewEnquiry] = useState({ company_name: "", email: "", phone: "", quantity: 10, hamper_details: "" });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  const [newReturn, setNewReturn] = useState({ order_id: "", reason: "", details: "" });
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);

  // AI Assistant states
  const [aiPrompt, setAiPrompt] = useState({ occasion_name: "Birthday", recipient_name: "" });
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const tabs = [
    { id: "orders", label: "📋 Orders Pipeline", icon: "📋" },
    { id: "occasions", label: "📅 Occasions Calendar", icon: "📅" },
    { id: "corporate", label: "🏢 Bulk Enquiries", icon: "🏢" },
    { id: "ai_assistant", label: "🤖 AI Gift Assistant", icon: "🤖" },
    { id: "returns", label: "🔄 Return Claims", icon: "🔄" },
  ];

  const fetchClientData = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch Orders
      const orderRes = await fetch(`${API_BASE}/api/orders`, { headers });
      if (orderRes.status === 401) {
        onUnauthorized();
        return;
      }
      if (!orderRes.ok) throw new Error("Failed to fetch your orders.");
      const orderData = await orderRes.json();
      setOrders(orderData);

      // Compute client metrics
      const total = orderData.length;
      const design = orderData.filter(o => o.status === "Design Received" || o.status === "Design Approval").length;
      const production = orderData.filter(o => o.status === "Printing" || o.status === "Packing").length;
      const delivery = orderData.filter(o => o.status === "Delivery").length;
      const actionRequired = orderData.filter(o => o.status === "Design Approval").length;
      setStats({ total, design, production, delivery, actionRequired });

      // Fetch Occasions
      const occasionRes = await fetch(`${API_BASE}/api/occasions`, { headers });
      if (occasionRes.ok) {
        const occasionData = await occasionRes.json();
        setOccasions(occasionData);
      }

      // Fetch Enquiries
      const enquiryRes = await fetch(`${API_BASE}/api/corporate-enquiries`, { headers });
      if (enquiryRes.ok) {
        const enquiryData = await enquiryRes.json();
        setEnquiries(enquiryData);
      }

      // Fetch Returns
      const returnRes = await fetch(`${API_BASE}/api/returns`, { headers });
      if (returnRes.ok) {
        const returnData = await returnRes.json();
        setReturns(returnData);
      }

    } catch (err) {
      setError(err.message || "Failed to load client workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [refreshTrigger]);

  // Handle Occasion Log
  const handleOccasionSubmit = async (e) => {
    e.preventDefault();
    if (!newOccasion.occasion_name.trim() || !newOccasion.recipient_name.trim() || !newOccasion.date) return;
    setOccasionSubmitting(true);
    setOccasionSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/api/occasions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newOccasion)
      });

      if (!response.ok) throw new Error("Failed to log occasion");
      const saved = await response.json();
      setOccasions(prev => [saved, ...prev]);
      setNewOccasion({ occasion_name: "", recipient_name: "", date: "" });
      setOccasionSuccess(true);
      setTimeout(() => setOccasionSuccess(false), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setOccasionSubmitting(false);
    }
  };

  // Handle Enquiry Log
  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!newEnquiry.company_name.trim() || !newEnquiry.hamper_details.trim()) return;
    setEnquirySubmitting(true);
    setEnquirySuccess(false);

    try {
      const response = await fetch(`${API_BASE}/api/corporate-enquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newEnquiry)
      });

      if (!response.ok) throw new Error("Failed to submit enquiry");
      const saved = await response.json();
      setEnquiries(prev => [saved, ...prev]);
      setNewEnquiry({
        company_name: "",
        email: user?.email || "",
        phone: "",
        quantity: 10,
        hamper_details: ""
      });
      setEnquirySuccess(true);
      setTimeout(() => setEnquirySuccess(false), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setEnquirySubmitting(false);
    }
  };

  // Handle Proposal Approval
  const handleApproveProposal = async (enquiryId) => {
    if (!window.confirm("Are you sure you want to approve this proposal?")) return;
    try {
      const response = await fetch(`${API_BASE}/api/corporate-enquiries/${enquiryId}/approve`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to approve proposal");
      const updated = await response.json();
      setEnquiries(prev => prev.map(e => e.id === enquiryId ? updated : e));
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Return Log
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!newReturn.order_id || !newReturn.reason.trim()) return;
    setReturnSubmitting(true);
    setReturnSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/api/returns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: parseInt(newReturn.order_id),
          reason: newReturn.reason,
          details: newReturn.details
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to submit return request");
      }
      const saved = await response.json();
      setReturns(prev => [saved, ...prev]);
      setNewReturn({ order_id: "", reason: "", details: "" });
      setReturnSuccess(true);
      setTimeout(() => setReturnSuccess(false), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Handle AI Recommendation Request
  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiPrompt.recipient_name.trim()) {
      setAiError("Recipient name is required.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    try {
      const url = `${API_BASE}/api/ai/recommend?occasion=${encodeURIComponent(aiPrompt.occasion_name)}&recipient=${encodeURIComponent(aiPrompt.recipient_name)}`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch recommendation");
      const result = await response.json();
      setAiResult(result);
    } catch (err) {
      console.error("AI recommendation error:", err);
      setAiError("Failed to get AI recommendation. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case "Design Received": return "w-1/5 bg-blue-500";
      case "Design Approval": return "w-2/5 bg-amber-500";
      case "Printing": return "w-3/5 bg-violet-500";
      case "Packing": return "w-4/5 bg-fuchsia-500";
      case "Delivery": return "w-full bg-emerald-500";
      default: return "w-0";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Design Received": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Design Approval": return "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
      case "Printing": return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Packing": return "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20";
      case "Delivery": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getOccasionText = (occ) => {
    return `${occ.recipient_name}'s ${occ.occasion_name}`;
  };

  // Pre-fill Order Creation from AI Recommendation
  const handlePreFill = (rec) => {
    // Navigate or call onCreateNewOrder with prefill parameters
    if (onCreateNewOrder) {
      onCreateNewOrder({
        product_name: rec.recommended_product,
        custom_name: rec.suggested_engraving,
        greeting_card: rec.suggested_card,
        packaging_material: rec.suggested_packaging,
        text_message: rec.sample_card_text,
        recipient_name: aiPrompt.recipient_name,
        order_type: "Personalized Gift"
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Client Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>✈️</span> Client Custom Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Submit design requests, log family occasions, get AI-based configuration suggestions, or submit bulk corporate hamper inquiries.
          </p>
        </div>
        <button
          onClick={() => onCreateNewOrder()}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition shadow-lg shadow-violet-600/20 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>➕</span> Launch Design Request
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={fetchClientData} className="underline text-xs font-semibold cursor-pointer">
            Retry Connection
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Requests</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{stats.total}</span>
            <span className="text-xs text-slate-500">items</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">In Design Layout</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{stats.design}</span>
            <span className="text-xs text-slate-500">steps</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">In Production</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{stats.production}</span>
            <span className="text-xs text-slate-500">stages</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Shipped / Complete</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{stats.delivery}</span>
            <span className="text-xs text-slate-500">delivd</span>
          </div>
        </div>

        <div className={`border p-5 rounded-2xl flex flex-col justify-between shadow-md transition ${
          stats.actionRequired > 0 
            ? "bg-amber-950/15 border-amber-500/30 text-amber-400 shadow-amber-950/5" 
            : "bg-slate-900 border-slate-800 text-slate-400"
        }`}>
          <p className="text-[10px] uppercase font-bold tracking-wider">Action Required</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-extrabold ${stats.actionRequired > 0 ? "text-amber-400" : "text-white"}`}>
              {stats.actionRequired}
            </span>
            <span className="text-xs">mockup approvals</span>
          </div>
          <span className={`text-[10px] font-semibold mt-3 ${stats.actionRequired > 0 ? "text-amber-300 animate-pulse" : "text-slate-500"}`}>
            {stats.actionRequired > 0 ? "⚠️ Needs design verification" : "✓ Setup is current"}
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 font-semibold text-xs tracking-tight transition rounded-t-xl border-t border-x border-transparent flex items-center gap-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-900 border-slate-850 text-violet-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl min-h-[400px]">
        {/* TAB 1: ORDERS PIPELINE */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white mb-2">📋 Personal Gifting Requests</h3>
            {loading && orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <svg className="animate-spin h-8 w-8 text-violet-500 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs">Fetching custom studio records...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400 text-xs">No personal orders logged under your account yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Gift Product</th>
                      <th className="py-3 px-4">Custom Spec</th>
                      <th className="py-3 px-4">Card / Wrap</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Workflow Tracker</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-850/30 transition cursor-pointer" onClick={() => onSelectOrder(ord.id)}>
                        <td className="py-4 px-4 font-mono text-slate-400">#{ord.id}</td>
                        <td className="py-4 px-4 font-bold text-white">{ord.product_name}</td>
                        <td className="py-4 px-4">
                          {ord.custom_name ? (
                            <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-violet-400 font-semibold border border-slate-800">"{ord.custom_name}"</span>
                          ) : (
                            <span className="text-slate-500 italic">None</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-400">
                          <div>🎁 {ord.packaging_material || "Standard"}</div>
                          <div className="text-[10px] text-slate-500">📇 {ord.greeting_card || "None"}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-block text-[10px] font-semibold border px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(ord.status)}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 w-40">
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-1">
                            <div className={`h-full rounded-full transition-all duration-500 ${getProgressWidth(ord.status)}`} />
                          </div>
                          <span className="text-[9px] text-slate-500 block font-mono">
                            {ord.status === "Design Received" && "Step 1/5: Received"}
                            {ord.status === "Design Approval" && "Step 2/5: Confirm Mockup!"}
                            {ord.status === "Printing" && "Step 3/5: Engraving Queue"}
                            {ord.status === "Packing" && "Step 4/5: Gift Wrapping"}
                            {ord.status === "Delivery" && "Step 5/5: Dispatched"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {ord.status === "Design Approval" ? (
                            <button
                              onClick={() => onSelectOrder(ord.id)}
                              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] rounded px-2.5 py-1.5 transition cursor-pointer"
                            >
                              ⚠️ Verify Mockup
                            </button>
                          ) : (
                            <button
                              onClick={() => onSelectOrder(ord.id)}
                              className="text-violet-400 hover:text-violet-300 font-semibold text-[10px] border border-violet-500/20 bg-violet-500/5 hover:bg-violet-600 hover:text-white rounded px-2.5 py-1.5 transition cursor-pointer"
                            >
                              Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OCCASIONS CALENDAR */}
        {activeTab === "occasions" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-850 h-fit">
              <h3 className="text-sm font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                <span>➕</span> Log Occasion Reminder
              </h3>
              {occasionSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs mb-4">
                  Occasion registered successfully! Follow-up reminders are queued.
                </div>
              )}
              <form onSubmit={handleOccasionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Occasion Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Birthday, Anniversary, Promotion"
                    value={newOccasion.occasion_name}
                    onChange={(e) => setNewOccasion(prev => ({ ...prev, occasion_name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grace Vance"
                    value={newOccasion.recipient_name}
                    onChange={(e) => setNewOccasion(prev => ({ ...prev, recipient_name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newOccasion.date}
                    onChange={(e) => setNewOccasion(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={occasionSubmitting}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg py-2.5 text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {occasionSubmitting ? "Registering..." : "Log Calendar Occasion"}
                </button>
              </form>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-white">📅 Your Follow-up Milestones</h3>
              {occasions.length === 0 ? (
                <div className="text-center py-10 bg-slate-950 border border-slate-850 rounded-xl">
                  <p className="text-slate-500 text-xs">No follow-up dates logged. Record occasions on the left to receive proactive gift prompts!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {occasions.map((occ) => (
                    <div key={occ.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center justify-between shadow">
                      <div>
                        <h4 className="text-white font-bold text-xs">{getOccasionText(occ)}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400">📅 {occ.date}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                            occ.status === "Notified" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-850 text-slate-400 border border-slate-800"
                          }`}>
                            {occ.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setAiPrompt({ occasion_name: occ.occasion_name, recipient_name: occ.recipient_name });
                          setActiveTab("ai_assistant");
                        }}
                        className="bg-violet-600/10 text-violet-400 border border-violet-500/20 hover:bg-violet-600 hover:text-white rounded px-2 py-1 text-[10px] font-semibold transition cursor-pointer"
                      >
                        🤖 Suggest Gift
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BULK ENQUIRIES */}
        {activeTab === "corporate" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-850 h-fit">
              <h3 className="text-sm font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                <span>🏢</span> Submit Corporate Bulk Enquiry
              </h3>
              {enquirySuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs mb-4">
                  Corporate bulk enquiry submitted successfully! Staff will review and prepare a custom price proposal.
                </div>
              )}
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wayne Enterprises"
                    value={newEnquiry.company_name}
                    onChange={(e) => setNewEnquiry(prev => ({ ...prev, company_name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. contact@wayne.com"
                      value={newEnquiry.email}
                      onChange={(e) => setNewEnquiry(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="555-0100"
                      value={newEnquiry.phone}
                      onChange={(e) => setNewEnquiry(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Required Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newEnquiry.quantity}
                    onChange={(e) => setNewEnquiry(prev => ({ ...prev, quantity: parseInt(e.target.value) || 10 }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gift Hamper details & Specifics *</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Describe specific products (e.g. Leather journals with custom team logo engraving, gold trim, black satin box packing)..."
                    value={newEnquiry.hamper_details}
                    onChange={(e) => setNewEnquiry(prev => ({ ...prev, hamper_details: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={enquirySubmitting}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg py-2.5 text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {enquirySubmitting ? "Submitting Request..." : "Request Bulk Pricing Proposal"}
                </button>
              </form>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-white">🏢 Corporate Proposal History</h3>
              {enquiries.length === 0 ? (
                <div className="text-center py-10 bg-slate-950 border border-slate-850 rounded-xl">
                  <p className="text-slate-500 text-xs">No active bulk hampers requested yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enquiries.map((enq) => (
                    <div key={enq.id} className="bg-slate-950 border border-slate-850 p-5 rounded-xl shadow-md space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div>
                          <h4 className="text-white font-bold text-xs">{enq.company_name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">Quantity: <span className="text-slate-200 font-bold">{enq.quantity} units</span></p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                          enq.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          enq.status === "Proposal Sent" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {enq.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed"><span className="text-[10px] font-bold text-slate-500 block uppercase">Request Spec:</span> {enq.hamper_details}</p>
                      
                      {enq.proposal_price && (
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 mt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-violet-400">OFFICIAL PROPOSAL FROM STAFF</span>
                            <span className="text-xs font-bold text-white">${enq.proposal_price.toLocaleString()} USD</span>
                          </div>
                          <p className="text-[11px] text-slate-400 italic font-medium">"{enq.proposal_notes}"</p>
                          {enq.status === "Proposal Sent" && (
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => handleApproveProposal(enq.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1.5 rounded transition cursor-pointer"
                              >
                                ✓ Accept & Approve Proposal Price
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AI GIFT ASSISTANT */}
        {activeTab === "ai_assistant" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <span className="text-3xl block">🤖</span>
              <h3 className="text-lg font-bold text-white">AI Personalization Studio</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                Provide the occasion type and recipient context, and our AI compiler will recommend a custom gift, layout, card, and wrapping template.
              </p>
            </div>

            <form onSubmit={handleAskAI} className="bg-slate-950 p-6 rounded-xl border border-slate-850 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Occasion / Context</label>
                  <select
                    value={aiPrompt.occasion_name}
                    onChange={(e) => setAiPrompt(prev => ({ ...prev, occasion_name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="Birthday">Birthday Theme</option>
                    <option value="Anniversary">Anniversary / Love</option>
                    <option value="Corporate Promotion">Corporate / Promotion / Boss</option>
                    <option value="Congratulations">Congratulations Celebration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alfred Pennyworth"
                    value={aiPrompt.recipient_name}
                    onChange={(e) => setAiPrompt(prev => ({ ...prev, recipient_name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>
              
              {aiError && <p className="text-rose-400 text-xs">{aiError}</p>}

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-2.5 rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
              >
                {aiLoading ? "Consulting AI Engraver..." : "Compile Custom Recommendation"}
              </button>
            </form>

            {aiResult && (
              <div className="bg-violet-950/10 border border-violet-800/30 rounded-xl p-6 space-y-4 shadow-inner animate-fadeIn">
                <div className="border-b border-violet-900/30 pb-3">
                  <h4 className="text-white font-bold text-sm">✨ Personalized Package Suggestion</h4>
                  <p className="text-slate-400 text-xs mt-1">Ready for custom order pre-fill</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Product Template</span>
                    <span className="text-white font-bold text-xs mt-1 block">{aiResult.recommended_product}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Engraving Text</span>
                    <span className="text-violet-400 font-mono text-xs mt-1 block font-bold">"{aiResult.suggested_engraving}"</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Packaging Material</span>
                    <span className="text-slate-300 font-bold block mt-1">{aiResult.suggested_packaging}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Greeting Card Theme</span>
                    <span className="text-slate-300 font-bold block mt-1">{aiResult.suggested_card}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg text-xs space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">AI Recommendation Logic</span>
                  <p className="text-slate-300 leading-relaxed italic">"{aiResult.ai_reasoning}"</p>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg text-xs space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Draft Greeting Card Message Text</span>
                  <pre className="text-slate-300 whitespace-pre-wrap font-mono text-xs leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800">
                    {aiResult.sample_card_text}
                  </pre>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handlePreFill(aiResult)}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-violet-600/10 cursor-pointer"
                  >
                    ⚡ Apply Configuration & Create Order
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: RETURN CLAIMS */}
        {activeTab === "returns" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-850 h-fit">
              <h3 className="text-sm font-bold text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                <span>🔄</span> Submit Return / Refund Claim
              </h3>
              {returnSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs mb-4">
                  Return request submitted successfully. Staff will evaluate shortly.
                </div>
              )}
              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Completed Order *</label>
                  <select
                    required
                    value={newReturn.order_id}
                    onChange={(e) => setNewReturn(prev => ({ ...prev, order_id: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">-- Select Completed Order --</option>
                    {orders.filter(o => o.status === "Delivery").map(o => (
                      <option key={o.id} value={o.id}>Order #{o.id} - {o.product_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Claim *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Incorrect Engraving spelling, Item Damaged"
                    value={newReturn.reason}
                    onChange={(e) => setNewReturn(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Additional Details</label>
                  <textarea
                    rows="3"
                    placeholder="Provide detailed description of the issue..."
                    value={newReturn.details}
                    onChange={(e) => setNewReturn(prev => ({ ...prev, details: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={returnSubmitting}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg py-2.5 text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {returnSubmitting ? "Submitting Claim..." : "File Return Request"}
                </button>
              </form>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-white">🔄 Claim Statuses</h3>
              {returns.length === 0 ? (
                <div className="text-center py-10 bg-slate-950 border border-slate-850 rounded-xl">
                  <p className="text-slate-500 text-xs">No active or historical returns filed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {returns.map((ret) => (
                    <div key={ret.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex justify-between items-center shadow-md">
                      <div>
                        <h4 className="text-white font-bold text-xs">Return Request for Order #{ret.order_id}</h4>
                        <p className="text-slate-400 text-[11px] mt-1">Reason: <span className="text-slate-200">{ret.reason}</span></p>
                        {ret.details && <p className="text-slate-500 text-[10px] mt-0.5">Details: {ret.details}</p>}
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                        ret.status === "Refunded" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        ret.status === "Approved" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {ret.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
