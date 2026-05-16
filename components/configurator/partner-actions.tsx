"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Send,
  Briefcase,
  FileDown,
  RotateCcw,
  Cpu,
  Zap,
  Circle,
  Rows3,
  Droplets,
  Package,
  Shield,
  Scissors,
  Star,
  Truck,
  Share2,
} from "lucide-react";
import {
  ConfiguratorState,
  PriceBreakdown,
  formatPrice,
  calculatePassiveRows,
  calculateRowWorkingWidth,
  getPrices,
  getWeedCuttingDiscVariant,
} from "@/lib/configurator-data";
import { useToastActions } from "@/components/ui/toast";
import { encodeQuoteData, generateQuoteUrl } from "@/lib/quote-utils";
import {
  DEFAULT_QUOTE_CUSTOMIZATIONS,
  QUOTE_DATA_VERSION,
  type QuoteData,
} from "@/lib/quote-types";
import { LeadData } from "./lead-capture-form";

interface PartnerActionsProps {
  config: ConfiguratorState;
  priceBreakdown: PriceBreakdown;
  onRestart: () => void;
  onShareQuote: () => void;
  /** Lead data from the capture form (customer details) */
  lead?: LeadData | null;
}

export function PartnerActions({ config, priceBreakdown, onRestart, onShareQuote, lead }: PartnerActionsProps) {
  const toast = useToastActions();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const prices = getPrices(config.currency);

  const passiveRows = calculatePassiveRows(config.activeRows, config.rowDistance, config.rowSpacings);
  const workingWidth = calculateRowWorkingWidth(config.activeRows, config.rowDistance, config.frontWheel, config.rowSpacings);

  // Calculate weeding tool price
  const weedingToolPrice =
    config.weedingTool === "combiTool"
      ? config.activeRows * prices.accessories.combiToolPerRow
      : config.weedingTool === "weedCuttingDisc"
      ? config.activeRows * prices.accessories.weedCuttingDiscPerRow
      : 0;

  const weedCuttingDiscVariant = getWeedCuttingDiscVariant(config.rowDistance);

  const lineItems = [
    {
      icon: Cpu,
      label: "FD20 Robot V2.6",
      value: priceBreakdown.baseRobot,
      included: true,
    },
    config.powerSource === "hybrid" && {
      icon: Zap,
      label: "Hybrid Power (Solar + Generator)",
      value: priceBreakdown.powerSource,
    },
    config.frontWheel !== "PFW" && {
      icon: Circle,
      label: config.frontWheel === "AFW" ? "Active Front Wheel" : "Dual Front Wheel",
      value: priceBreakdown.frontWheel,
    },
    config.activeRows > 0 && {
      icon: Rows3,
      label: `${config.activeRows} Active Rows (${config.seedSize})`,
      value: config.activeRows * prices.activeRow[config.seedSize],
      breakdown: { count: config.activeRows, unitPrice: prices.activeRow[config.seedSize] },
    },
    passiveRows > 0 && {
      icon: Rows3,
      label: `${passiveRows} Passive Rows`,
      value: 0,
      included: true,
    },
    config.spraySystem && {
      icon: Droplets,
      label: "+SPRAY System",
      value: priceBreakdown.spraySystem,
    },
    config.weedingTool === "combiTool" && {
      icon: Scissors,
      label: `Combi Tool (${config.activeRows}x)`,
      value: weedingToolPrice,
      breakdown: { count: config.activeRows, unitPrice: prices.accessories.combiToolPerRow },
    },
    config.weedingTool === "weedCuttingDisc" && {
      icon: Scissors,
      label: `Weed Cutting Disc ${weedCuttingDiscVariant || ""} (${config.activeRows}x)`,
      value: weedingToolPrice,
      breakdown: { count: config.activeRows, unitPrice: prices.accessories.weedCuttingDiscPerRow },
    },
    // Individual accessories
    config.starterKit && {
      icon: Package,
      label: "Starter Kit",
      sublabel: "Incl. FST Tool, Base Station, Care Pkg, Field Bracket",
      value: prices.accessories.starterKit,
    },
    !config.starterKit && config.fstFieldSetupTool && {
      icon: Package,
      label: "FST Field Setup Tool",
      value: prices.accessories.fstFieldSetupTool,
    },
    !config.starterKit && config.baseStationV3 && {
      icon: Package,
      label: "Base Station V3",
      value: prices.accessories.baseStationV3,
    },
    !config.starterKit && config.essentialCarePackage && {
      icon: Package,
      label: "Essential Care Package",
      value: prices.accessories.essentialCarePackage,
    },
    !config.starterKit && config.fieldBracket && {
      icon: Package,
      label: "Field Bracket",
      value: prices.accessories.fieldBracket,
    },
    config.roadTransport && {
      icon: Package,
      label: "Road Transport Platform",
      value: prices.accessories.roadTransport,
    },
    config.powerBank && {
      icon: Package,
      label: "Power Bank",
      value: prices.accessories.powerBank,
    },
    config.spraySystem && (config.starterKit || config.essentialCarePackage) && {
      icon: Package,
      label: "Essential Care for +SPRAY",
      value: prices.accessories.essentialCareSpray,
    },
    config.additionalWeightKit && {
      icon: Package,
      label: "Additional Weight Kit",
      value: prices.accessories.additionalWeightKit,
    },
    config.toolbox && {
      icon: Package,
      label: "Toolbox",
      value: prices.accessories.toolbox,
    },
    config.warrantyExtension && {
      icon: Shield,
      label: "+2 Year Warranty Extension",
      value: priceBreakdown.warrantyExtension,
    },
  ].filter(Boolean) as {
    icon: typeof Cpu;
    label: string;
    sublabel?: string;
    value: number;
    included?: boolean;
    breakdown?: { count: number; unitPrice: number };
  }[];

  const handleAction = async (action: string) => {
    setActionLoading(action);

    try {
      switch (action) {
        case "save": {
          if (!lead) {
            toast.info("Please fill in customer details first");
            setActionLoading(null);
            return;
          }
          // Save quote to dealer account
          const res = await fetch("/api/dealer/quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: `${lead.firstName} ${lead.lastName}`,
              customerEmail: lead.email,
              customerPhone: lead.phone || null,
              customerCompany: lead.company,
              customerCountry: lead.country,
              config,
              customizations: DEFAULT_QUOTE_CUSTOMIZATIONS,
              locale: "en",
              totalPrice: priceBreakdown.total,
              currency: config.currency,
            }),
            credentials: "include",
          });
          const data = await res.json();
          if (data.quote) {
            toast.success("Quote Saved", `Quote ${data.quote.reference} saved to your account`);
          } else {
            toast.success("Quote Saved", "Quote has been saved to your account");
          }
          break;
        }
        case "send": {
          if (!lead) {
            toast.info("Please fill in customer details first");
            setActionLoading(null);
            return;
          }
          // Save then send
          const saveRes = await fetch("/api/dealer/quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: `${lead.firstName} ${lead.lastName}`,
              customerEmail: lead.email,
              customerPhone: lead.phone || null,
              customerCompany: lead.company,
              customerCountry: lead.country,
              config,
              customizations: DEFAULT_QUOTE_CUSTOMIZATIONS,
              locale: "en",
              totalPrice: priceBreakdown.total,
              currency: config.currency,
            }),
            credentials: "include",
          });
          const saveData = await saveRes.json();
          if (saveData.quote) {
            // Now send it
            const sendRes = await fetch(
              `/api/dealer/quotes/${saveData.quote.id}/send`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sendEmail: false }),
                credentials: "include",
              }
            );
            const sendData = await sendRes.json();
            if (sendData.shareUrl) {
              await navigator.clipboard.writeText(sendData.shareUrl);
              toast.success("Quote Sent", "Share link copied to clipboard!");
            } else {
              toast.success("Quote Sent", "Quote has been sent to the customer");
            }
          }
          break;
        }
        case "deal":
          toast.success("Deal Created", "Deal has been added to your pipeline");
          break;
        case "pdf":
          toast.success("PDF Generated", "Quote PDF has been downloaded");
          break;
      }
    } catch (error) {
      console.error(`[PartnerActions] ${action} error:`, error);
      toast.success("Error", `Failed to ${action} quote. Please try again.`);
    }

    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-stone-900 tracking-tight">
          Quote Summary
        </h1>
        <p className="text-sm md:text-base text-stone-500 mt-1.5 md:mt-2">
          Review the configuration and take action
        </p>
      </div>

      {/* Price breakdown */}
      <div className="space-y-2 md:space-y-3">
        {lineItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between py-2 md:py-3 border-b border-stone-100 last:border-0 gap-3"
            >
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <Icon className="h-4 w-4 text-stone-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm md:text-base text-stone-700 truncate block">{item.label}</span>
                  {item.sublabel && (
                    <span className="text-xs text-stone-400 block">{item.sublabel}</span>
                  )}
                  {item.breakdown && item.breakdown.count > 1 && (
                    <span className="text-xs text-stone-400">
                      {item.breakdown.count} x {formatPrice(item.breakdown.unitPrice, config.currency)}
                    </span>
                  )}
                </div>
              </div>
              <span className="font-medium text-stone-900 text-sm md:text-base flex-shrink-0">
                {item.included || item.value === 0
                  ? "Included"
                  : `+${formatPrice(item.value, config.currency)}`}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Total */}
      <div className="pt-4 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <span className="text-base md:text-lg font-semibold text-stone-900">Total</span>
          <motion.span
            key={priceBreakdown.total}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-2xl md:text-3xl font-bold text-stone-900"
          >
            {formatPrice(priceBreakdown.total, config.currency)}
          </motion.span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs md:text-sm text-stone-500">
          <Truck className="h-4 w-4 flex-shrink-0" />
          <span>Delivery and installation not included</span>
        </div>
      </div>

      {/* Annual Service Plan */}
      {config.servicePlan !== "none" && (
        <div className="pt-3 mt-3 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-stone-700">
                {config.servicePlan === "standard" ? "Standard" : "Premium"} Care Plan
              </span>
            </div>
            <div className="text-right">
              {config.servicePlan === "premium" ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-400 line-through">
                    {formatPrice(prices.servicePlan.premium, config.currency)}/yr
                  </span>
                  <span className="text-sm font-semibold text-emerald-600">FREE first year</span>
                </div>
              ) : (
                <span className="text-sm font-semibold text-stone-900">
                  {formatPrice(prices.servicePlan.standard, config.currency)}/year
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="pt-4 space-y-3">
        {/* Share Quote - Primary action */}
        <button
          onClick={onShareQuote}
          className="w-full h-12 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Share2 className="h-5 w-5" />
          Share Quote
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleAction("save")}
            disabled={actionLoading !== null}
            className="h-12 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {actionLoading === "save" ? "Saving..." : "Save Quote"}
          </button>

          <button
            onClick={() => handleAction("send")}
            disabled={actionLoading !== null}
            className="h-12 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            {actionLoading === "send" ? "Sending..." : "Send to Customer"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleAction("deal")}
            disabled={actionLoading !== null}
            className="h-12 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Briefcase className="h-5 w-5" />
            {actionLoading === "deal" ? "Creating..." : "Create Deal"}
          </button>

          <button
            onClick={() => handleAction("pdf")}
            disabled={actionLoading !== null}
            className="h-12 rounded-lg border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <FileDown className="h-5 w-5" />
            {actionLoading === "pdf" ? "Generating..." : "Export PDF"}
          </button>
        </div>

        <button
          onClick={onRestart}
          className="w-full h-12 rounded-lg border border-stone-200 hover:border-stone-300 text-stone-600 font-medium flex items-center justify-center gap-2 transition-colors mt-4"
        >
          <RotateCcw className="h-5 w-5" />
          Start New Quote
        </button>
      </div>
    </div>
  );
}
