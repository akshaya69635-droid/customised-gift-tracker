import { useState, useEffect } from "react";
import { API_BASE } from "../config";

export default function OrderForm({ onOrderCreated, token, onUnauthorized, user, prefillData }) {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    recipient_name: "",
    recipient_address: "",
    product_name: "Engraved Cherrywood Notebook",
    order_type: "Personalized Gift",
    custom_name: "",
    text_message: "",
    photo_url: "",
    packaging_material: "Signature Gold Foil",
    greeting_card: "Birthday Theme",
    special_instructions: "",
  });

  useEffect(() => {
    if (user && user.role === "client") {
      setFormData((prev) => ({
        ...prev,
        customer_name: user.full_name || "",
        customer_email: user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (prefillData) {
      setFormData((prev) => ({
        ...prev,
        product_name: prefillData.product_name || prev.product_name,
        custom_name: prefillData.custom_name || prev.custom_name,
        greeting_card: prefillData.greeting_card || prev.greeting_card,
        packaging_material: prefillData.packaging_material || prev.packaging_material,
        text_message: prefillData.text_message || prev.text_message,
        recipient_name: prefillData.recipient_name || prev.recipient_name,
        order_type: prefillData.order_type || prev.order_type,
      }));
    }
  }, [prefillData]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const productsList = [
    "Engraved Cherrywood Notebook",
    "Embossed Leather Journal",
    "Custom Resin Paperweight",
    "Engraved Arc Reactor Desk Clock",
    "Monogrammed Leather Travel Bag",
  ];

  const packagingOptions = [
    "Signature Gold Foil",
    "Recycled Craft Box",
    "Premium Satin Bag",
  ];

  const cardOptions = [
    "Birthday Theme",
    "Thank You Theme",
    "Congratulations Card",
    "Love & Anniversary",
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.customer_name.trim()) newErrors.customer_name = "Customer Name is required";
    if (!formData.customer_email.trim()) {
      newErrors.customer_email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
      newErrors.customer_email = "Please enter a valid email address";
    }
    if (!formData.recipient_name.trim()) newErrors.recipient_name = "Recipient Name is required";
    if (!formData.recipient_address.trim()) newErrors.recipient_address = "Recipient Address is required";
    if (!formData.product_name.trim()) newErrors.product_name = "Product name is required";
    if (!formData.order_type.trim()) newErrors.order_type = "Order type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleProductSelect = (product) => {
    setFormData((prev) => ({ ...prev, product_name: product }));
  };

  const getLiveAIRecommendation = () => {
    const prod = formData.product_name.toLowerCase();
    const name = formData.custom_name;
    const msg = formData.text_message;
    const namePhrase = name ? ` ${name}` : "";
    const clientPhrase = msg ? ` "${msg}"` : " a beautiful day ahead";
    
    if (prod.includes("notebook") || prod.includes("journal")) {
      return `✍️ Recommendation for Notebook/Journal:\n\nDraft 1: "To${namePhrase}, may every page of this custom journal be filled with your most brilliant ideas and happiest memories. ${clientPhrase.replace(/"/g, '')}."\n\nDraft 2: "Write your own future${namePhrase}. Crafted especially for you. ${msg || 'With warm regards.'}"`;
    } else if (prod.includes("paperweight")) {
      return `✨ Recommendation for Resin Glass Paperweight:\n\nDraft 1: "A moment frozen in glass. To${namePhrase}, to keep your workspace anchored and your dreams soaring. ${msg || 'With love.'}"`;
    } else if (prod.includes("clock")) {
      return `⏰ Recommendation for Custom Clock:\n\nDraft 1: "To${namePhrase}, marking the beautiful moments we've shared and the timeless memories yet to come. ${msg || 'Happy celebrations!'}"`;
    } else {
      return `🎁 Recommendation for Customized Gifting:\n\nDraft 1: "A bespoke gift crafted especially for${namePhrase}. May it bring a smile to your face. ${msg || 'Warmest wishes.'}"`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError("");
    setSubmitSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create order");
      }

      const createdOrder = await response.json();
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        customer_name: user?.role === "client" ? (user.full_name || "") : "",
        customer_email: user?.role === "client" ? (user.email || "") : "",
        recipient_name: "",
        recipient_address: "",
        product_name: "Engraved Cherrywood Notebook",
        order_type: "Personalized Gift",
        custom_name: "",
        text_message: "",
        photo_url: "",
        packaging_material: "Signature Gold Foil",
        greeting_card: "Birthday Theme",
        special_instructions: "",
      });

      if (onOrderCreated) {
        onOrderCreated(createdOrder);
      }
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>✈️</span> New Customization Request
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Submit personalization details for a new customised gift or corporate bundle.
        </p>
      </div>

      {submitSuccess && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <span className="text-lg">✅</span>
          <div>
            <span className="font-semibold">Order placed successfully!</span> The customization tracking workflow has started.
          </div>
        </div>
      )}

      {serverError && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <span className="font-semibold">Submission failed:</span> {serverError}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer Info */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 pb-1 border-b border-slate-800">
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Customer Name *</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="e.g. Tony Stark"
                readOnly={user?.role === "client"}
                className={`w-full text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  user?.role === "client" 
                    ? "bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed" 
                    : "bg-slate-950 border-slate-800 focus:border-slate-700"
                } ${errors.customer_name ? "border-rose-500 focus:ring-rose-500" : ""}`}
              />
              {errors.customer_name && <p className="text-rose-400 text-xs mt-1">{errors.customer_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Customer Email *</label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                placeholder="e.g. tony@stark.com"
                readOnly={user?.role === "client"}
                className={`w-full text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  user?.role === "client" 
                    ? "bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed" 
                    : "bg-slate-950 border-slate-800 focus:border-slate-700"
                } ${errors.customer_email ? "border-rose-500 focus:ring-rose-500" : ""}`}
              />
              {errors.customer_email && <p className="text-rose-400 text-xs mt-1">{errors.customer_email}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Recipient Details */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 pb-1 border-b border-slate-800">
            Delivery Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Recipient Name *</label>
              <input
                type="text"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={handleChange}
                placeholder="e.g. Pepper Potts"
                className={`w-full bg-slate-950 border text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  errors.recipient_name ? "border-rose-500 focus:ring-rose-500" : "border-slate-800 focus:border-slate-700"
                }`}
              />
              {errors.recipient_name && <p className="text-rose-400 text-xs mt-1">{errors.recipient_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Order Type *</label>
              <select
                name="order_type"
                value={formData.order_type}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-slate-700"
              >
                <option value="Personalized Gift">Personalized Gift</option>
                <option value="Corporate Bundle">Corporate Bundle</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Delivery Address *</label>
            <textarea
              name="recipient_address"
              value={formData.recipient_address}
              onChange={handleChange}
              rows="2"
              placeholder="Full physical street address, city, state, zip"
              className={`w-full bg-slate-950 border text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                errors.recipient_address ? "border-rose-500 focus:ring-rose-500" : "border-slate-800 focus:border-slate-700"
              }`}
            />
            {errors.recipient_address && <p className="text-rose-400 text-xs mt-1">{errors.recipient_address}</p>}
          </div>
        </div>

        {/* Section 3: Customization Fields */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 pb-1 border-b border-slate-800">
            Customization Details
          </h3>
          <div className="space-y-4">
            {/* Product selection helper */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Select Gift Template</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {productsList.map((prod) => (
                  <button
                    key={prod}
                    type="button"
                    onClick={() => handleProductSelect(prod)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      formData.product_name === prod
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                        : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-850"
                    }`}
                  >
                    {prod}
                  </button>
                ))}
              </div>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                placeholder="Or type a custom product details"
                className={`w-full bg-slate-950 border text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  errors.product_name ? "border-rose-500 focus:ring-rose-500" : "border-slate-800 focus:border-slate-700"
                }`}
              />
              {errors.product_name && <p className="text-rose-400 text-xs mt-1">{errors.product_name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Engraving/Embossing Name</label>
                <input
                  type="text"
                  name="custom_name"
                  value={formData.custom_name}
                  onChange={handleChange}
                  placeholder="e.g. PEPPER (Leave blank if none)"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Reference Image/Photo URL</label>
                <input
                  type="url"
                  name="photo_url"
                  value={formData.photo_url}
                  onChange={handleChange}
                  placeholder="e.g. https://image.com/myphoto.jpg (Optional)"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Packaging Material</label>
                <select
                  name="packaging_material"
                  value={formData.packaging_material}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-slate-700"
                >
                  {packagingOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Greeting Card Theme</label>
                <select
                  name="greeting_card"
                  value={formData.greeting_card}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-slate-700"
                >
                  {cardOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Custom Text Message / Gift Card Note</label>
              <textarea
                name="text_message"
                value={formData.text_message}
                onChange={handleChange}
                rows="2"
                placeholder="Type the message to print, engrave, or write on the gift card..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Special Instructions</label>
              <textarea
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleChange}
                rows="2"
                placeholder="Any special handling notes, designer guidelines or delivery notes..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-slate-700"
              />
            </div>

            {/* AI Assistant Preview */}
            <div className="bg-violet-950/20 border border-violet-800/40 rounded-xl p-4 mt-2">
              <div className="flex items-center gap-2 mb-2 text-violet-400 font-semibold text-xs uppercase tracking-wider">
                <span>🤖</span> AI Assistant Recommendation Preview
              </div>
              <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-850">
                {getLiveAIRecommendation()}
              </pre>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl py-3 text-sm transition shadow-lg shadow-violet-600/25 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing custom order...
              </span>
            ) : (
              "Submit Custom Order"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
