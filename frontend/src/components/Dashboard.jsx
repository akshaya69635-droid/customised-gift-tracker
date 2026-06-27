import { useState, useEffect } from "react";
import { API_BASE } from "../config";

export default function Dashboard({ onSelectOrder, onCreateNewOrder, refreshTrigger, token, onUnauthorized }) {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [orders, setOrders] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [returns, setReturns] = useState([]);
  const [occasions, setOccasions] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    total_orders: 0,
    design_received: 0,
    design_approval: 0,
    printing: 0,
    packing: 0,
    delivery: 0,
    priority_alerts: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pipeline Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Proposal Submission State (keyed by enquiryId)
  const [proposalForm, setProposalForm] = useState({});

  const tabs = [
    { id: "pipeline", label: "📋 Orders Pipeline", icon: "📋" },
    { id: "corporate", label: "🏢 Corporate Proposals", icon: "🏢" },
    { id: "calendar", label: "📅 Calendar Reminders", icon: "📅" },
    { id: "returns", label: "🔄 Return Requests", icon: "🔄" },
    { id: "reports", label: "📊 Admin Reports", icon: "📊" },
  ];

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = {
        "Authorization": `Bearer ${token}`
      };

      // Build query string for orders pipeline
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append("status", statusFilter);
      if (typeFilter) queryParams.append("order_type", typeFilter);
      if (search) queryParams.append("search", search);
      if (priorityFilter) {
        queryParams.append("is_priority", priorityFilter === "stuck" ? "true" : "false");
      }

      // 1. Fetch Orders
      const ordersRes = await fetch(`${API_BASE}/api/orders?${queryParams.toString()}`, { headers });
      if (ordersRes.status === 401) {
        onUnauthorized();
        return;
      }
      if (!ordersRes.ok) throw new Error("Failed to fetch orders.");
      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      // 2. Fetch Stats
      const statsRes = await fetch(`${API_BASE}/api/orders/stats`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 3. Fetch Enquiries
      const enquiriesRes = await fetch(`${API_BASE}/api/corporate-enquiries`, { headers });
      if (enquiriesRes.ok) {
        const enquiriesData = await enquiriesRes.json();
        setEnquiries(enquiriesData);
      }

      // 4. Fetch Returns
      const returnsRes = await fetch(`${API_BASE}/api/returns`, { headers });
      if (returnsRes.ok) {
        const returnsData = await returnsRes.json();
        setReturns(returnsData);
      }

      // 5. Fetch Occasions
      const occasionsRes = await fetch(`${API_BASE}/api/occasions`, { headers });
      if (occasionsRes.ok) {
        const occasionsData = await occasionsRes.json();
        setOccasions(occasionsData);
      }

    } catch (err) {
      setError(err.message || "Failed to sync control panel metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, typeFilter, priorityFilter, search, refreshTrigger]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setPriorityFilter("");
  };

  // Submit Corporate Proposal
  const handleProposalSubmit = async (enquiryId) => {
    const data = proposalForm[enquiryId];
    if (!data || !data.proposal_price || !data.proposal_notes?.trim()) {
      alert("Please enter a valid price proposal and note description.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/corporate-enquiries/${enquiryId}/proposal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          proposal_price: parseFloat(data.proposal_price),
          proposal_notes: data.proposal_notes
        })
      });

      if (!response.ok) throw new Error("Failed to submit proposal");
      const updated = await response.json();
      setEnquiries(prev => prev.map(e => e.id === enquiryId ? updated : e));
      setProposalForm(prev => {
        const updatedForms = { ...prev };
        delete updatedForms[enquiryId];
        return updatedForms;
      });
      alert("Proposal pricing submitted and client notified!");
    } catch (err) {
      alert(err.message);
    }
  };

  // Update Return Status
  const handleReturnAction = async (returnId, targetStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/returns/${returnId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      });

      if (!response.ok) throw new Error("Failed to process return action");
      const updated = await response.json();
      setReturns(prev => prev.map(r => r.id === returnId ? updated : r));
      alert(`Claim status updated to ${targetStatus}!`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Download CSV Report
  const handleDownloadCSV = () => {
    const csvUrl = `${API_BASE}/api/reports/csv`;
    // Create an anchor tag and trigger a download with JWT authorization token embedded (via a temporary redirect or simple fetch download)
    fetch(csvUrl, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error("Could not fetch CSV file.");
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `order_workflow_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        alert("Export failed: " + err.message);
      });
  };

  const getStageColor = (status) => {
    switch (status) {
      case "Design Received": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Design Approval": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Printing": return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Packing": return "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20";
      case "Delivery": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Control Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>🎁</span> Customised Gift Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage customization pipelines, send corporate proposals, track occasions, and process return requests.
          </p>
        </div>
        <button
          onClick={() => onCreateNewOrder()}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition shadow-lg shadow-violet-600/20 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>➕</span> Place Custom Order
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboardData} className="underline text-xs font-semibold cursor-pointer">
            Retry Connection
          </button>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Active</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{stats.total_orders}</span>
            <span className="text-xs text-slate-500">jobs</span>
          </div>
        </div>

        {/* Design Received */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Design Recd</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{stats.design_received}</span>
            <span className="text-[10px] text-blue-500 font-semibold">Stage 1</span>
          </div>
        </div>

        {/* Design Approval */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Design Apprv</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{stats.design_approval}</span>
            <span className="text-[10px] text-amber-500 font-semibold">Stage 2</span>
          </div>
        </div>

        {/* Printing */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Printing</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{stats.printing}</span>
            <span className="text-[10px] text-violet-500 font-semibold">Stage 3</span>
          </div>
        </div>

        {/* Packing */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <p className="text-[10px] uppercase font-bold text-fuchsia-400 tracking-wider">Packing</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{stats.packing}</span>
            <span className="text-[10px] text-fuchsia-500 font-semibold">Stage 4</span>
          </div>
        </div>

        {/* Stuck SLA Alerts */}
        <div className={`border p-5 rounded-2xl flex flex-col justify-between shadow-md transition ${
          stats.priority_alerts > 0 
            ? "bg-rose-950/15 border-rose-500/30 text-rose-400 shadow-rose-950/5" 
            : "bg-slate-900 border-slate-800 text-slate-400"
        }`}>
          <p className="text-[10px] uppercase font-bold tracking-wider">Stuck Alerts</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-extrabold ${stats.priority_alerts > 0 ? "text-rose-400" : "text-white"}`}>
              {stats.priority_alerts}
            </span>
            <span className="text-xs">overdue</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab Panel Render */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl min-h-[400px]">
        
        {/* PIPELINE TAB */}
        {activeTab === "pipeline" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4 shadow-inner">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Keywords</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Client Name, Recipient Name, or Custom Gift details..."
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div className="w-full lg:w-44">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stage Filter</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-350 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">All Stages</option>
                    <option value="Design Received">Design Received</option>
                    <option value="Design Approval">Design Approval</option>
                    <option value="Printing">Printing</option>
                    <option value="Packing">Packing</option>
                    <option value="Delivery">Delivery</option>
                  </select>
                </div>
                <div className="w-full lg:w-40">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Order Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-350 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">All Types</option>
                    <option value="Personalized Gift">Personalized Gift</option>
                    <option value="Corporate Bundle">Corporate Bundle</option>
                  </select>
                </div>
                <div className="w-full lg:w-36">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">SLA Alerts</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-350 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="stuck">⚠️ Stuck Alert</option>
                    <option value="healthy">✓ On Schedule</option>
                  </select>
                </div>
              </div>

              {(search || statusFilter || typeFilter || priorityFilter) && (
                <div className="flex justify-end pt-1">
                  <button onClick={clearFilters} className="text-xs text-violet-400 hover:text-violet-300 font-semibold cursor-pointer">
                    ✕ Clear Search Filters
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            {loading && orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <svg className="animate-spin h-8 w-8 text-violet-500 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs">Fetching pipeline records...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-400 text-xs">No orders match the filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">ID</th>
                      <th className="py-4 px-6">Product Details</th>
                      <th className="py-4 px-6">Client / Recipient</th>
                      <th className="py-4 px-6">Customize Fields</th>
                      <th className="py-4 px-6">Stage</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {orders.map((ord) => (
                      <tr
                        key={ord.id}
                        className={`hover:bg-slate-850/30 transition cursor-pointer ${
                          ord.is_priority_alert ? "bg-rose-500/5 hover:bg-rose-500/10" : ""
                        }`}
                        onClick={() => onSelectOrder(ord.id)}
                      >
                        <td className="py-4 px-6 font-mono text-slate-300">
                          <div className="flex items-center gap-2">
                            {ord.is_priority_alert && <span className="text-rose-500" title={ord.alert_reason}>🚨</span>}
                            <span>#{ord.id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-white font-bold">{ord.product_name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{ord.order_type}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div><span className="font-bold text-slate-200">{ord.customer_name}</span> to <span className="font-bold text-slate-200">{ord.recipient_name}</span></div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{ord.customer_email}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-350">
                          {ord.custom_name && <div>📇 Engraving: "{ord.custom_name}"</div>}
                          {ord.packaging_material && <div>🎁 Wrap: {ord.packaging_material}</div>}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block text-[10px] font-semibold border px-2.5 py-0.5 rounded-full ${getStageColor(ord.status)}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectOrder(ord.id)}
                            className="text-violet-400 hover:text-violet-300 font-bold border border-violet-500/20 bg-violet-500/5 hover:bg-violet-600 hover:text-white rounded px-3 py-1.5 transition cursor-pointer"
                          >
                            Manage →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CORPORATE PROPOSALS TAB */}
        {activeTab === "corporate" && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white mb-2">🏢 Corporate Bulk Hamper Proposals</h3>
            {enquiries.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-10 bg-slate-950 rounded-xl">No corporate enquiries submitted yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-4 shadow flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-bold text-sm">{enq.company_name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{enq.email} | {enq.phone}</p>
                        </div>
                        <span className={`text-[10px] font-semibold border px-2.5 py-0.5 rounded-full ${
                          enq.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          enq.status === "Proposal Sent" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {enq.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-350 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-900">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Enquiry Specification</span>
                        {enq.hamper_details}
                      </div>

                      <div className="text-xs text-slate-400 flex justify-between">
                        <span>Quantity Requested:</span>
                        <span className="font-bold text-slate-200">{enq.quantity} units</span>
                      </div>
                    </div>

                    {enq.status === "Received" ? (
                      <div className="bg-slate-900 border border-slate-850 p-4 rounded-lg space-y-3 mt-2">
                        <span className="text-[10px] font-bold text-violet-400 block uppercase">Draft Pricing Proposal</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <label className="text-[10px] text-slate-400 block font-semibold mb-1">Price ($ USD)</label>
                            <input
                              type="number"
                              required
                              placeholder="e.g. 2500"
                              value={proposalForm[enq.id]?.proposal_price || ""}
                              onChange={(e) => setProposalForm(prev => ({
                                ...prev,
                                [enq.id]: { ...prev[enq.id], proposal_price: e.target.value }
                              }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-slate-400 block font-semibold mb-1">Proposal Pitch / Details</label>
                            <input
                              type="text"
                              required
                              placeholder="Include details, card selection, etc."
                              value={proposalForm[enq.id]?.proposal_notes || ""}
                              onChange={(e) => setProposalForm(prev => ({
                                ...prev,
                                [enq.id]: { ...prev[enq.id], proposal_notes: e.target.value }
                              }))}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleProposalSubmit(enq.id)}
                          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2 rounded transition cursor-pointer"
                        >
                          🚀 Send Pricing Proposal
                        </button>
                      </div>
                    ) : (
                      <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-200">
                          <span className="text-[10px] text-slate-500">PROPOSAL SENT VALUE</span>
                          <span>${enq.proposal_price} USD</span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic font-medium">"{enq.proposal_notes}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CALENDAR REMINDERS TAB */}
        {activeTab === "calendar" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white mb-2">📅 Client Special Occasion Registry</h3>
            <p className="text-slate-400 text-xs">These are custom gifting occasions logged by clients for follow-up reminders.</p>
            {occasions.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-10 bg-slate-950 rounded-xl">No active occasions logged.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {occasions.map((occ) => (
                  <div key={occ.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                      <span className="text-xs text-slate-400 font-semibold">Milestone:</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                        occ.status === "Notified" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>{occ.status}</span>
                    </div>
                    <div className="text-xs">
                      <p className="text-white font-bold">{occ.recipient_name}</p>
                      <p className="text-violet-400 text-[11px] font-semibold mt-0.5">{occ.occasion_name}</p>
                      <p className="text-slate-500 font-mono text-[10px] mt-2">📅 Occasion Date: {occ.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RETURN REQUESTS TAB */}
        {activeTab === "returns" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white mb-2">🔄 Return Claims Manager</h3>
            {returns.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-10 bg-slate-950 rounded-xl">No customer return requests logged.</p>
            ) : (
              <div className="space-y-4">
                {returns.map((ret) => (
                  <div key={ret.id} className="bg-slate-950 border border-slate-850 p-5 rounded-xl shadow-md flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded">Claim #{ret.id}</span>
                        <span className="text-slate-500 text-xs">For Order ID: <span className="text-slate-300 font-bold">#{ret.order_id}</span></span>
                      </div>
                      <p className="text-xs font-bold text-white">Reason: {ret.reason}</p>
                      {ret.details && <p className="text-xs text-slate-400 leading-normal bg-slate-900/30 p-2.5 rounded border border-slate-900 mt-1.5 italic font-medium">"{ret.details}"</p>}
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                        ret.status === "Refunded" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        ret.status === "Approved" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {ret.status}
                      </span>
                      
                      {ret.status === "Pending Review" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReturnAction(ret.id, "Approved")}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReturnAction(ret.id, "Refunded")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded transition cursor-pointer"
                          >
                            Refund
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADMIN REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="space-y-6 max-w-xl mx-auto text-center py-6">
            <span className="text-4xl">📊</span>
            <h3 className="text-lg font-bold text-white">Export Order Workflow Report</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
              Download the entire customization active list, recipient details, engraving logs, greeting card messages, packaging categories, and statuses as a CSV spreadsheet.
            </p>
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-500 block uppercase text-[10px] font-bold">Total Orders</span>
                <span className="text-white font-bold text-lg">{stats.total_orders}</span>
              </div>
              <div className="border-x border-slate-850">
                <span className="text-slate-500 block uppercase text-[10px] font-bold">Stuck SLAs</span>
                <span className="text-rose-400 font-bold text-lg">{stats.priority_alerts}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px] font-bold">In Production</span>
                <span className="text-violet-400 font-bold text-lg">{stats.printing + stats.packing}</span>
              </div>
            </div>
            <div>
              <button
                onClick={handleDownloadCSV}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold px-8 py-3 rounded-xl text-xs transition shadow-lg shadow-violet-600/20 cursor-pointer flex items-center justify-center gap-2 mx-auto"
              >
                📥 Download CSV Report
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
