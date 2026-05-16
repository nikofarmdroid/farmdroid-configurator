"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Edit3,
  Trash2,
  Copy,
  Check,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Tractor,
  MapPin,
  Mail,
  Phone,
  Building2,
  Cpu,
  Zap,
  Rows3,
  Droplets,
  Package,
  Shield,
  FileText,
} from "lucide-react";
import { formatPrice, type Currency } from "@/lib/configurator-data";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Draft", color: "bg-stone-100 text-stone-600", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  viewed: { label: "Viewed", color: "bg-purple-100 text-purple-700", icon: Eye },
  accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  declined: { label: "Declined", color: "bg-red-100 text-red-700", icon: XCircle },
  expired: { label: "Expired", color: "bg-amber-100 text-amber-700", icon: Clock },
};

export default function DealerQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    shareUrl?: string;
    emailResult?: any;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/dealer/quotes/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Quote not found");
        const data = await res.json();
        setQuote(data.quote);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/dealer/quotes/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendEmail: false }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({ shareUrl: data.shareUrl, emailResult: data.emailResult });
        setQuote(data.quote);
      }
    } catch (e) {
      console.error("Send failed:", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this quote? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dealer/quotes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/dealer/dashboard");
      }
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    if (sendResult?.shareUrl) {
      await navigator.clipboard.writeText(sendResult.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-stone-400">Loading quote...</div>
    );
  }

  if (error || !quote) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-600 mb-4">{error || "Quote not found"}</p>
        <Link
          href="/dealer/dashboard"
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const status = statusConfig[quote.status] || statusConfig.draft;
  const StatusIcon = status.icon;
  const config = quote.config || {};
  const customer = {
    name: quote.customer_name || "—",
    email: quote.customer_email,
    phone: quote.customer_phone,
    company: quote.customer_company,
    country: quote.customer_country,
  };
  const customizations = quote.customizations || {};

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + actions bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dealer/dashboard"
          className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="flex items-center gap-2">
          {quote.status === "draft" && (
            <>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSending ? "Sending..." : "Send to Customer"}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {quote.status !== "draft" && quote.share_token && (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSending ? "Resending..." : "Resend Quote"}
            </button>
          )}
        </div>
      </div>

      {/* Send result modal */}
      {sendResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="font-semibold text-emerald-900">Quote Ready</h3>
              <p className="text-sm text-emerald-700">
                Share this link with your customer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-emerald-200 rounded-lg px-4 py-2.5 text-sm text-stone-700 font-mono break-all">
              {sendResult.shareUrl}
            </code>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Quote header */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-stone-900">
                {quote.reference}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {status.label}
              </span>
            </div>
            <p className="text-stone-500">
              Created {new Date(quote.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              {quote.valid_until && (
                <span className="text-stone-400">
                  {" "}· Valid until{" "}
                  {new Date(quote.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-stone-900">
              {formatPrice(quote.total_price, quote.currency as Currency)}
            </p>
            {quote.view_count > 0 && (
              <p className="text-xs text-stone-400 mt-1">
                Viewed {quote.view_count} time{quote.view_count > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Two columns: customer info + config summary */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer info */}
          <div className="bg-stone-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
              Customer
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <span className="text-stone-900 font-medium">{customer.name}</span>
              </div>
              {customer.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Tractor className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-stone-600">{customer.company}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-stone-600">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-stone-600">{customer.phone}</span>
                </div>
              )}
              {customer.country && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="text-stone-600">{customer.country}</span>
                </div>
              )}
            </div>
            {quote.customer_notes && (
              <div className="mt-3 pt-3 border-t border-stone-200">
                <p className="text-xs text-stone-500 font-medium mb-1">Notes</p>
                <p className="text-sm text-stone-600">{quote.customer_notes}</p>
              </div>
            )}
          </div>

          {/* Config summary */}
          <div className="bg-stone-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
              Configuration
            </h3>
            <div className="space-y-2 text-sm">
              {config.activeRows > 0 && (
                <div className="flex items-center gap-2">
                  <Rows3 className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-700">
                    {config.activeRows} active rows ({config.seedSize || "—"})
                    {config.rowDistance ? `, ${config.rowDistance}mm spacing` : ""}
                  </span>
                </div>
              )}
              {config.frontWheel && config.frontWheel !== "PFW" && (
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-700">
                    {config.frontWheel === "AFW" ? "Active Front Wheel" : "Dual Front Wheel"}
                  </span>
                </div>
              )}
              {config.powerSource && config.powerSource !== "solar" && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-700">
                    {config.powerSource === "hybrid" ? "Hybrid Power" : "Generator"}
                  </span>
                </div>
              )}
              {config.spraySystem && (
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-700">+SPRAY System</span>
                </div>
              )}
              {config.servicePlan && config.servicePlan !== "none" && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-700">
                    {config.servicePlan === "premium" ? "Premium" : "Standard"} Care Plan
                  </span>
                </div>
              )}
              {customizations.notes && (
                <div className="flex items-start gap-2 pt-2 border-t border-stone-200 mt-2">
                  <FileText className="w-4 h-4 text-stone-400 mt-0.5" />
                  <span className="text-stone-600">{customizations.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
