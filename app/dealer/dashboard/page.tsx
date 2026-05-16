"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  ExternalLink,
  Edit3,
  MoreHorizontal,
} from "lucide-react";
import { useDealer } from "@/contexts/DealerContext";
import { formatPrice, type Currency } from "@/lib/configurator-data";

interface DealerQuote {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string | null;
  customer_company: string | null;
  customer_country: string | null;
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";
  total_price: number;
  currency: string;
  share_token: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Draft", color: "bg-stone-100 text-stone-600", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  viewed: { label: "Viewed", color: "bg-purple-100 text-purple-700", icon: Eye },
  accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  declined: { label: "Declined", color: "bg-red-100 text-red-700", icon: XCircle },
  expired: { label: "Expired", color: "bg-amber-100 text-amber-700", icon: Clock },
};

export default function DealerDashboardPage() {
  const { dealer } = useDealer();
  const router = useRouter();
  const [quotes, setQuotes] = useState<DealerQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchQuotes = useCallback(async () => {
    try {
      const url =
        statusFilter === "all"
          ? "/api/dealer/quotes"
          : `/api/dealer/quotes?status=${statusFilter}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error("Failed to fetch quotes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Stats
  const stats = {
    total: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    viewed: quotes.filter((q) => q.status === "viewed").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
  };

  const filters = ["all", "draft", "sent", "viewed", "accepted", "declined", "expired"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
          <p className="text-stone-500 mt-1">
            {dealer?.companyName} — {dealer?.dealerCode}
          </p>
        </div>
        <Link
          href="/en/configurator?mode=partner"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Quote
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "bg-stone-100" },
          { label: "Draft", value: stats.draft, color: "bg-stone-100" },
          { label: "Sent", value: stats.sent, color: "bg-blue-50" },
          { label: "Viewed", value: stats.viewed, color: "bg-purple-50" },
          { label: "Accepted", value: stats.accepted, color: "bg-emerald-50" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} rounded-xl p-4 text-center`}
          >
            <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
            <p className="text-xs text-stone-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === f
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Quote list */}
      {isLoading ? (
        <div className="text-center py-12 text-stone-400">Loading...</div>
      ) : quotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white rounded-xl border border-stone-200"
        >
          <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-700 mb-2">
            No quotes yet
          </h3>
          <p className="text-stone-500 mb-6">
            Create your first quote to get started
          </p>
          <Link
            href="/en/configurator?mode=partner"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Quote
          </Link>
        </motion.div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Reference
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Customer
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Company
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Total
                  </th>
                  <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                  <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {quotes.map((quote, i) => {
                  const status = statusConfig[quote.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <motion.tr
                      key={quote.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-stone-50/50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <span className="text-sm font-mono font-medium text-stone-900">
                          {quote.reference}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-stone-700">
                          {quote.customer_name}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-stone-500">
                          {quote.customer_company || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-medium text-stone-900">
                          {formatPrice(quote.total_price, quote.currency as Currency)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-xs text-stone-400">
                          {new Date(quote.created_at).toLocaleDateString("en-GB")}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              router.push(`/dealer/quotes/${quote.id}`)
                            }
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-stone-100">
            {quotes.map((quote, i) => {
              const status = statusConfig[quote.status] || statusConfig.draft;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => router.push(`/dealer/quotes/${quote.id}`)}
                  className="p-4 hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono font-medium text-stone-900 text-sm">
                        {quote.reference}
                      </p>
                      <p className="text-sm text-stone-700">
                        {quote.customer_name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>{quote.customer_company || "—"}</span>
                    <span className="font-medium text-stone-900">
                      {formatPrice(quote.total_price, quote.currency as Currency)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
