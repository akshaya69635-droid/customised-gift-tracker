import { useState, useEffect } from "react";
import { API_BASE } from "../config";

const WORKFLOW_STAGES = [
  "Design Received",
  "Design Approval",
  "Printing",
  "Packing",
  "Delivery"
];

export default function OrderDetailView({ orderId, onClose, onOrderUpdated, token, onUnauthorized, user }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Progress status form state
  const [nextOwner, setNextOwner] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [targetStatus, setTargetStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch order details.");
      }
      const data = await response.json();
      setOrder(data);
      
      // Determine what the logical next status is
      const currentIndex = WORKFLOW_STAGES.indexOf(data.status);
      if (currentIndex !== -1 && currentIndex < WORKFLOW_STAGES.length - 1) {
        setTargetStatus(WORKFLOW_STAGES[currentIndex + 1]);
      } else {
        setTargetStatus(data.status); // Fallback to current if finished
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!nextOwner.trim()) {
      setUpdateError("Staff name is required to progress order.");
      return;
    }

    setUpdating(true);
    setUpdateError("");

    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: targetStatus,
          owner: nextOwner,
          notes: statusNotes.trim() || undefined,
        }),
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to update status.");
      }

      const updatedData = await response.json();
      setOrder(updatedData);
      setStatusNotes(""); // clear note field
      
      // Update preselected next stage
      const currentIndex = WORKFLOW_STAGES.indexOf(updatedData.status);
      if (currentIndex !== -1 && currentIndex < WORKFLOW_STAGES.length - 1) {
        setTargetStatus(WORKFLOW_STAGES[currentIndex + 1]);
      } else {
        setTargetStatus(updatedData.status);
      }

      if (onOrderUpdated) {
        onOrderUpdated(updatedData);
      }
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleClientApprove = async () => {
    setUpdating(true);
    setUpdateError("");
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "Printing",
          owner: user?.full_name || "Client",
          notes: "Mockup layout approved online by client.",
        }),
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to submit mockup approval.");
      }

      const updatedData = await response.json();
      setOrder(updatedData);
      
      // Update preselected next stage
      const currentIndex = WORKFLOW_STAGES.indexOf(updatedData.status);
      if (currentIndex !== -1 && currentIndex < WORKFLOW_STAGES.length - 1) {
        setTargetStatus(WORKFLOW_STAGES[currentIndex + 1]);
      } else {
        setTargetStatus(updatedData.status);
      }

      if (onOrderUpdated) {
        onOrderUpdated(updatedData);
      }
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg className="animate-spin h-8 w-8 text-violet-500 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm">Loading tracking details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-center">
        <p className="text-sm font-semibold">Error Loading Order</p>
        <p className="text-xs mt-1">{error || "Order not found"}</p>
        <button onClick={onClose} className="mt-4 text-xs font-semibold underline text-violet-400 cursor-pointer">
          Go Back to Dashboard
        </button>
      </div>
    );
  }



  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs font-mono">
              ID: #{order.id}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              order.order_type === "Corporate Bundle" ? "bg-amber-500/15 text-amber-400" : "bg-cyan-500/15 text-cyan-400"
            }`}>
              {order.order_type}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{order.product_name}</h2>
          <p className="text-slate-400 text-xs mt-0.5">Ordered: {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 rounded-xl transition cursor-pointer"
          title="Back to Dashboard"
        >
          ✕ Close
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        
        {/* Left Side: Customization Details & Progress Update Form */}
        <div className="lg:col-span-7 p-6 space-y-6">
          
          {/* Priority Alert Banner if Stuck */}
          {order.is_priority_alert && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex gap-3 items-start">
              <span className="text-lg">🚨</span>
              <div>
                <p className="font-bold text-rose-300">Priority Warning (Stuck Order)</p>
                <p className="mt-0.5 text-slate-300 leading-relaxed">{order.alert_reason}</p>
              </div>
            </div>
          )}

          {/* Next Action Brief Box */}
          <div className="bg-violet-950/15 border border-violet-500/20 text-violet-300 p-4 rounded-xl text-xs flex gap-3 items-start">
            <span className="text-lg">💡</span>
            <div>
              <p className="font-bold text-violet-200">Recommended Next Step</p>
              <p className="mt-0.5 text-slate-300 leading-relaxed">{order.next_action_brief}</p>
            </div>
          </div>

          {/* AI Assistant Advice Box */}
          {order.ai_recommendation && (
            <div className="bg-violet-950/25 border border-violet-850/40 text-violet-350 p-4 rounded-xl text-xs flex gap-3 items-start shadow-sm">
              <span className="text-lg">🤖</span>
              <div className="w-full">
                <p className="font-bold text-violet-200 uppercase tracking-wider text-[10px] mb-1">AI Assistant Workflow Advice</p>
                <pre className="text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed mt-1.5 bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                  {order.ai_recommendation}
                </pre>
              </div>
            </div>
          )}

          {/* Customer & Recipient Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-xs space-y-2">
              <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Client Details</h4>
              <p className="text-white font-medium text-sm">{order.customer_name}</p>
              <p className="text-slate-400">{order.customer_email}</p>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-xs space-y-2">
              <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Shipping Destination</h4>
              <p className="text-white font-medium text-sm">{order.recipient_name}</p>
              <p className="text-slate-400 line-clamp-2">{order.recipient_address}</p>
            </div>
          </div>

          {/* Personalization Spec Sheet */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl text-xs space-y-4">
            <h4 className="text-slate-300 font-bold text-xs border-b border-slate-800 pb-2 flex justify-between items-center">
              <span>Personalization Specification</span>
              <span className="text-[10px] text-violet-400 font-mono">Stage: {order.status}</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 font-medium mb-1">Custom Engraving Name</p>
                {order.custom_name ? (
                  <p className="bg-slate-900 border border-slate-800 font-mono text-white text-sm px-3 py-1.5 rounded-lg inline-block select-all">
                    {order.custom_name}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">None requested</p>
                )}
              </div>

              {order.photo_url && (
                <div>
                  <p className="text-slate-500 font-medium mb-1">Reference Image Link</p>
                  <a
                    href={order.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1.5 underline"
                  >
                    🔗 View Image Resource
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 font-medium mb-1">Packaging Material</p>
                <p className="text-slate-200 font-medium">{order.packaging_material || "Standard Wrapper"}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium mb-1">Greeting Card Theme</p>
                <p className="text-slate-200 font-medium">{order.greeting_card || "None Selected"}</p>
              </div>
            </div>

            <div>
              <p className="text-slate-500 font-medium mb-1.5">Card Text / Engraving Message</p>
              {order.text_message ? (
                <p className="bg-slate-900 border border-slate-800 text-slate-300 text-sm px-3 py-2.5 rounded-lg font-serif italic whitespace-pre-wrap">
                  "{order.text_message}"
                </p>
              ) : (
                <p className="text-slate-500 italic text-xs">No customized message supplied</p>
              )}
            </div>

            {order.special_instructions && (
              <div>
                <p className="text-slate-500 font-medium mb-1">Special Instructions</p>
                <p className="bg-slate-900 border border-slate-800 text-slate-300 text-xs p-2.5 rounded-lg leading-relaxed">
                  {order.special_instructions}
                </p>
              </div>
            )}
          </div>

          {/* Mockup Approval for Clients OR Workflow Update for Staff */}
          {user?.role === "client" ? (
            order.status === "Design Approval" ? (
              <div className="bg-amber-950/15 border border-amber-500/30 rounded-xl p-5 space-y-4">
                <div className="flex gap-3 items-start">
                  <span className="text-xl">🎨</span>
                  <div>
                    <h4 className="text-amber-400 font-bold text-sm">Design Verification Required</h4>
                    <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                      Our design studio has prepared the engraving layout. Please review the specification sheet above. If the details are correct, click the approval button below to release the order to physical production.
                    </p>
                  </div>
                </div>
                
                {updateError && (
                  <p className="text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                    ⚠️ {updateError}
                  </p>
                )}

                <button
                  onClick={handleClientApprove}
                  disabled={updating}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-lg py-3 text-xs tracking-wider uppercase transition shadow-lg shadow-amber-600/15 disabled:opacity-50 cursor-pointer text-center"
                >
                  {updating ? "Submitting approval..." : "✓ Confirm & Approve Design Mockup"}
                </button>
              </div>
            ) : (
              <div className="bg-slate-950/30 border border-slate-850 text-slate-400 p-5 rounded-xl text-xs flex gap-2 items-center">
                <span>🔒</span>
                <span>Order is in **{order.status}** stage. Staff are processing your order.</span>
              </div>
            )
          ) : (
            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5">
              <h4 className="text-white font-bold text-sm mb-3.5">⚙️ Update Workflow Stage</h4>
              
              {updateError && (
                <p className="text-rose-400 text-xs font-semibold mb-3 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  ⚠️ {updateError}
                </p>
              )}

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Change Stage To</label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-slate-700"
                    >
                      {WORKFLOW_STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage} {stage === order.status ? "(Current)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Staff Assignee *</label>
                    <input
                      type="text"
                      value={nextOwner}
                      onChange={(e) => setNextOwner(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Workflow Notes / Comments</label>
                  <textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows="2"
                    placeholder="Record what has changed or any special notes (e.g. tracking numbers, mock feedback)..."
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg py-2.5 text-xs transition shadow-lg shadow-violet-600/10 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 cursor-pointer"
                >
                  {updating ? "Submitting stage progress..." : "Advance / Update Stage"}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right Side: Chronological History Timeline */}
        <div className="lg:col-span-5 p-6 bg-slate-950/20">
          <h3 className="text-white font-bold text-sm mb-6 flex items-center gap-2">
            <span>📋</span> Customization History Logs
          </h3>

          <div className="relative border-l border-slate-800 pl-5 ml-2.5 space-y-6">
            {order.history && order.history.length > 0 ? (
              order.history.map((log) => {
                const isCurrent = log.status === order.status;
                return (
                  <div key={log.id} className="relative">
                    {/* Timeline Node Icon */}
                    <span className={`absolute -left-[29px] top-0.5 flex items-center justify-center w-4 h-4 rounded-full border-2 ${
                      isCurrent 
                        ? "bg-violet-500 border-violet-400 shadow-md shadow-violet-500/20 animate-pulse" 
                        : "bg-slate-900 border-slate-700"
                    }`} />
                    
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <span className={`text-xs font-semibold ${isCurrent ? "text-violet-400" : "text-slate-300"}`}>
                          {log.status}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.updated_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="bg-slate-900/60 border border-slate-850 p-2.5 rounded-lg text-xs text-slate-400">
                        <p className="leading-relaxed whitespace-pre-wrap">{log.notes || "No status notes provided."}</p>
                        <div className="mt-1.5 flex justify-end">
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                            By: {log.owner}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-xs italic">No history logs discovered for this order.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
