"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Building2,
  Check,
  Cpu,
  Zap,
  Circle,
  Rows3,
  Droplets,
  Package,
  X,
  Send,
  Loader2,
  Truck,
  Shield,
  Star,
  Scissors,
  Share2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { ConfigPageData, CONFIG_PAGE_VERSION } from "@/lib/config-page-types";
import { encodeConfigPageData, generateConfigReference } from "@/lib/config-page-utils";
import {
  ConfiguratorState,
  PriceBreakdown,
  formatPrice,
  calculatePassiveRows,
  calculateRowWorkingWidth,
  getPrices,
  getWeedCuttingDiscVariant,
} from "@/lib/configurator-data";
import { QuoteCustomizationModal } from "@/components/quote/QuoteCustomizationModal";
import { useMode } from "@/contexts/ModeContext";
import { useToastActions } from "@/components/ui/toast";
import { LeadCaptureForm, LeadData } from "./lead-capture-form";
import { ThankYouScreen } from "./thank-you-screen";
import { PartnerActions } from "./partner-actions";
import Image from "next/image";

interface StepSummaryProps {
  config: ConfiguratorState;
  updateConfig: (updates: Partial<ConfiguratorState>) => void;
  priceBreakdown: PriceBreakdown;
  onReset: () => void;
  initialLead?: LeadData | null;
  existingReference?: string | null;
}

// Email Quote Modal
function EmailQuoteModal({
  isOpen,
  onClose,
  config,
  priceBreakdown,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: ConfiguratorState;
  priceBreakdown: PriceBreakdown;
}) {
  const tForms = useTranslations("forms");
  const tModals = useTranslations("modals");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  // Email validation
  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };
  const emailError = emailTouched && email && !isValidEmail(email);

  const handleSend = async () => {
    if (!isValidEmail(email)) {
      setEmailTouched(true);
      return;
    }
    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSending(false);
    setSent(true);
    setTimeout(() => {
      onClose();
      setSent(false);
      setEmail("");
      setName("");
      setCompany("");
      setEmailTouched(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[calc(100vh-32px)] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">{tModals("emailQuote.title")}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-stone-100 text-stone-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-stone-900" />
              </div>
              <h4 className="text-lg font-semibold text-stone-900">{tModals("emailQuote.sent")}</h4>
              <p className="text-stone-500 mt-1">{tModals("emailQuote.checkInbox")}</p>
            </motion.div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-stone-700">{tForms("name")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full h-11 px-4 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                  placeholder={tForms("placeholders.yourName")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">{tForms("company")}</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="mt-1 w-full h-11 px-4 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                  placeholder={tForms("placeholders.companyName")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">{tForms("email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`mt-1 w-full h-11 px-4 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:border-transparent ${
                    emailError
                      ? "border-red-400 focus:ring-red-500"
                      : "border-stone-200 focus:ring-emerald-500"
                  }`}
                  placeholder={tForms("placeholders.email")}
                />
                {emailError && (
                  <p className="mt-1 text-xs text-red-500">{tForms("validation.invalidEmail")}</p>
                )}
              </div>

              <div className="bg-stone-50 rounded-lg p-4 mt-4">
                <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">{tModals("emailQuote.quotePreview")}</p>
                <p className="text-lg font-bold text-stone-900">{formatPrice(priceBreakdown.total, config.currency)}</p>
              </div>
            </>
          )}
        </div>

        {!sent && (
          <div className="p-6 border-t border-stone-100 flex-shrink-0">
            <button
              onClick={handleSend}
              disabled={!email || !isValidEmail(email) || sending}
              className="w-full h-12 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {sending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {tModals("emailQuote.sending")}
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  {tModals("emailQuote.sendQuote")}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Create Deal Modal
function CreateDealModal({
  isOpen,
  onClose,
  config,
  priceBreakdown,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: ConfiguratorState;
  priceBreakdown: PriceBreakdown;
}) {
  const tForms = useTranslations("forms");
  const tModals = useTranslations("modals");
  const [dealName, setDealName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCreating(false);
    setCreated(true);
    setTimeout(() => {
      onClose();
      setCreated(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[calc(100vh-32px)] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">{tModals("createDeal.title")}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-stone-100 text-stone-400"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {created ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-stone-900" />
              </div>
              <h4 className="text-lg font-semibold text-stone-900">{tModals("createDeal.created")}</h4>
              <p className="text-stone-500 mt-1">{tModals("createDeal.addedToPipeline")}</p>
            </motion.div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-stone-700">{tForms("dealName")}</label>
                <input
                  type="text"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  className="mt-1 w-full h-11 px-4 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                  placeholder={tForms("placeholders.dealName")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">{tForms("company")}</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full h-11 px-4 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                  placeholder={tForms("placeholders.companyName")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">{tForms("contactName")}</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="mt-1 w-full h-11 px-4 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                  placeholder={tForms("placeholders.primaryContact")}
                />
              </div>

              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">{tModals("createDeal.dealValue")}</p>
                <p className="text-2xl font-bold text-stone-900">{formatPrice(priceBreakdown.total, config.currency)}</p>
              </div>
            </>
          )}
        </div>

        {!created && (
          <div className="p-6 border-t border-stone-100 flex-shrink-0">
            <button
              onClick={handleCreate}
              disabled={!dealName || creating}
              className="w-full h-12 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {creating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {tModals("createDeal.creating")}
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5" />
                  {tModals("createDeal.createDeal")}
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function StepSummary({ config, priceBreakdown, onReset, initialLead, existingReference }: StepSummaryProps) {
  const t = useTranslations("summary");
  const tCommon = useTranslations("common");
  const tModals = useTranslations("modals");
  const tQuote = useTranslations("quote");
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "en";
  const { mode } = useMode();

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  const prices = getPrices(config.currency);

  const passiveRows = calculatePassiveRows(config.activeRows, config.rowDistance, config.rowSpacings);
  // Use saved workingWidth from config (set in step-row-config), with fallback for backward compatibility
  const workingWidth = config.workingWidth ?? calculateRowWorkingWidth(config.activeRows, config.rowDistance, config.frontWheel, config.rowSpacings);

  // Calculate weeding tool price
  const weedingToolPrice = config.weedingTool === "combiTool"
    ? config.activeRows * prices.accessories.combiToolPerRow
    : config.weedingTool === "weedCuttingDisc"
    ? config.activeRows * prices.accessories.weedCuttingDiscPerRow
    : 0;

  const weedCuttingDiscVariant = getWeedCuttingDiscVariant(config.rowDistance);

  const lineItems = [
    {
      icon: Cpu,
      label: t("lineItems.baseRobot"),
      value: priceBreakdown.baseRobot,
      included: true,
    },
    config.powerSource === "hybrid" && {
      icon: Zap,
      label: t("lineItems.hybridPower"),
      value: priceBreakdown.powerSource,
    },
    config.frontWheel !== "PFW" && {
      icon: Circle,
      label: config.frontWheel === "AFW" ? t("lineItems.activeFrontWheel") : t("lineItems.dualFrontWheel"),
      value: priceBreakdown.frontWheel,
    },
    config.activeRows > 0 && {
      icon: Rows3,
      label: t("lineItems.activeRows", { count: config.activeRows, size: config.seedSize }),
      value: config.activeRows * prices.activeRow[config.seedSize],
      breakdown: { count: config.activeRows, unitPrice: prices.activeRow[config.seedSize] },
    },
    passiveRows > 0 && {
      icon: Rows3,
      label: t("lineItems.passiveRows", { count: passiveRows }),
      value: 0,
      included: true,
    },
    config.spraySystem && {
      icon: Droplets,
      label: t("lineItems.spraySystem"),
      value: priceBreakdown.spraySystem,
    },
    config.weedingTool === "combiTool" && {
      icon: Scissors,
      label: t("lineItems.combiTool", { count: config.activeRows }),
      value: weedingToolPrice,
      breakdown: { count: config.activeRows, unitPrice: prices.accessories.combiToolPerRow },
    },
    config.weedingTool === "weedCuttingDisc" && {
      icon: Scissors,
      label: t("lineItems.weedCuttingDisc", { count: config.activeRows, variant: weedCuttingDiscVariant || "" }),
      value: weedingToolPrice,
      breakdown: { count: config.activeRows, unitPrice: prices.accessories.weedCuttingDiscPerRow },
    },
    // Individual accessories (instead of single "Accessories" line)
    config.starterKit && {
      icon: Package,
      label: t("lineItems.starterKit"),
      sublabel: t("lineItems.starterKitIncludes"),
      value: prices.accessories.starterKit,
    },
    // Items included in Starter Kit - only show individually if Starter Kit NOT selected
    !config.starterKit && config.fstFieldSetupTool && {
      icon: Package,
      label: t("lineItems.fstTool"),
      value: prices.accessories.fstFieldSetupTool,
    },
    !config.starterKit && config.baseStationV3 && {
      icon: Package,
      label: t("lineItems.baseStation"),
      value: prices.accessories.baseStationV3,
    },
    !config.starterKit && config.essentialCarePackage && {
      icon: Package,
      label: t("lineItems.essentialCare"),
      value: prices.accessories.essentialCarePackage,
    },
    !config.starterKit && config.fieldBracket && {
      icon: Package,
      label: t("lineItems.fieldBracket"),
      value: prices.accessories.fieldBracket,
    },
    // Items NOT in Starter Kit - always show if selected
    config.roadTransport && {
      icon: Package,
      label: t("lineItems.roadTransport"),
      value: prices.accessories.roadTransport,
    },
    config.powerBank && {
      icon: Package,
      label: t("lineItems.powerBank"),
      value: prices.accessories.powerBank,
    },
    config.spraySystem && (config.starterKit || config.essentialCarePackage) && {
      icon: Package,
      label: t("lineItems.essentialCareSpray"),
      value: prices.accessories.essentialCareSpray,
    },
    config.additionalWeightKit && {
      icon: Package,
      label: t("lineItems.weightKit"),
      value: prices.accessories.additionalWeightKit,
    },
    config.toolbox && {
      icon: Package,
      label: t("lineItems.toolbox"),
      value: prices.accessories.toolbox,
    },
    config.warrantyExtension && {
      icon: Shield,
      label: t("lineItems.warrantyExtension"),
      value: priceBreakdown.warrantyExtension,
    },
  ].filter(Boolean) as { icon: typeof Cpu; label: string; sublabel?: string; value: number; included?: boolean; breakdown?: { count: number; unitPrice: number } }[];

  // Handle lead submission in public mode
  const toast = useToastActions();
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleLeadSubmit = async (lead: LeadData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead,
          config,
          locale,
          totalPrice: priceBreakdown.total,
          currency: config.currency,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      const { reference } = await response.json();
      router.push(`/${locale}/config/${reference}`); // Short URL!
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Error", "Failed to save your configuration. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Handle updating an existing configuration
  // Handle updating an existing configuration (called from LeadCaptureForm)
  const handleUpdateConfigWithLead = async (lead: LeadData) => {
    if (!existingReference) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/configurations/${existingReference}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          totalPrice: priceBreakdown.total,
          currency: config.currency,
          leadUpdates: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            phone: lead.phone,
            country: lead.country,
            region: lead.region,
            isFarmer: lead.isFarmer,
            farmingType: lead.farmingType,
            farmSize: lead.farmSize,
            hectaresForFarmDroid: lead.hectaresForFarmDroid,
            crops: lead.crops,
            otherCrops: lead.otherCrops,
            contactByPartner: lead.contactByPartner,
            marketingConsent: lead.marketingConsent,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update configuration");
      }

      router.push(`/${locale}/config/${existingReference}`);
    } catch (error) {
      console.error("Error updating config:", error);
      toast.error("Error", "Failed to update your configuration. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Check if we're in edit mode (have existing reference and lead data)
  const isEditMode = Boolean(existingReference && initialLead);
  // Check if we're in "known contact" mode (have lead data but no reference - start fresh scenario)
  const isKnownContactMode = Boolean(!existingReference && initialLead);

  // Handle restart (for both modes)
  const handleRestart = () => {
    setShowThankYou(false);
    setLeadData(null);
    onReset();
  };

  // Public mode: Show thank you screen after form submission
  if (mode === "public" && showThankYou && leadData) {
    return <ThankYouScreen lead={leadData} config={config} onRestart={handleRestart} />;
  }

  // Public mode: Show lead capture form or update UI
  if (mode === "public") {
    return (
      <>
        {/* Full-screen loading overlay */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-emerald-200"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <p className="text-lg font-medium text-stone-900">{t("submitting.title")}</p>
                <p className="text-sm text-stone-500 mt-1">{t("submitting.subtitle")}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 lg:gap-12 py-6 md:py-8 pb-24">
        {/* Left: Logo - Takes 3 columns, sticky on desktop */}
        <div className="lg:col-span-3 hidden lg:block">
          {/* Sticky logo container - centered vertically in viewport */}
          <div className="sticky top-[50vh] -translate-y-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-xs"
            >
              <Image
                src="/images/farmdroid-logo.png"
                alt="FarmDroid"
                width={300}
                height={300}
                className="w-full h-auto"
              />
            </motion.div>
          </div>
        </div>

        {/* Right: Lead Capture Form - Takes 2 columns on desktop, full width on mobile */}
        <div className="lg:col-span-2">
          {/* Mobile logo and config summary */}
          <div className="lg:hidden mb-6">
            <div className="flex justify-center py-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[200px]"
              >
                <Image
                  src="/images/farmdroid-logo.png"
                  alt="FarmDroid"
                  width={200}
                  height={200}
                  className="w-full h-auto"
                />
              </motion.div>
            </div>
            {/* Config summary row - mobile only */}
            <div className="flex justify-center gap-6 pt-4 border-t border-stone-100">
              <div className="text-center">
                <p className="text-xl font-semibold text-stone-900">
                  {config.activeRows}
                  <span className="text-sm font-normal text-stone-400 ml-0.5">{t("configLabels.rows")}</span>
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{t("configLabels.active")}</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-stone-900">
                  {(workingWidth / 10).toFixed(0)}
                  <span className="text-sm font-normal text-stone-400 ml-0.5">cm</span>
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{t("configLabels.workingWidth")}</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-stone-900">
                  {config.powerSource === "hybrid" ? t("configLabels.hybrid") : t("configLabels.solar")}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">{t("configLabels.power")}</p>
              </div>
            </div>
          </div>

          <LeadCaptureForm
            config={config}
            priceBreakdown={priceBreakdown}
            onSubmit={isEditMode ? handleUpdateConfigWithLead : handleLeadSubmit}
            initialLead={initialLead}
            startAsRecognized={isEditMode || isKnownContactMode}
          />
        </div>
      </div>
      </>
    );
  }

  // Partner mode: Show full summary with prices and partner actions
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 lg:gap-12 py-6 md:py-8 pb-24">
        {/* Left: Visualization - Takes 3 columns */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Robot visualization */}
          <div className="flex-1 flex items-center justify-center py-4 md:py-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg"
            >
              <svg viewBox="0 0 200 160" className="w-full h-auto">
                {/* Spray tank if enabled */}
                {config.spraySystem && (
                  <motion.g
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <rect x="70" y="8" width="60" height="22" rx="4" fill="#3b82f6" />
                    <text x="100" y="23" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      110L
                    </text>
                  </motion.g>
                )}

                {/* Solar panels */}
                <rect x="30" y="30" width="140" height="18" rx="4" fill="#10b981" />
                {[0, 1, 2, 3].map((i) => (
                  <line key={i} x1={50 + i * 32} y1="30" x2={50 + i * 32} y2="48" stroke="#047857" strokeWidth="2" />
                ))}

                {/* Robot body */}
                <rect x="40" y="48" width="120" height="60" rx="8" fill="#059669" />

                {/* Display */}
                <rect x="70" y="58" width="60" height="25" rx="4" fill="#1f2937" />
                <motion.rect
                  x="75" y="63" width="50" height="15" rx="2" fill="#10b981" opacity="0.5"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Generator if hybrid */}
                {config.powerSource === "hybrid" && (
                  <motion.g
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <rect x="8" y="68" width="28" height="35" rx="3" fill="#6b7280" />
                    <rect x="12" y="72" width="20" height="8" rx="1" fill="#374151" />
                    <motion.rect
                      x="16" y="84" width="6" height="6" fill="#22c55e"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <path d="M36 85 L48 85 L48 75" stroke="#f59e0b" strokeWidth="2" fill="none" />
                  </motion.g>
                )}

                {/* Spray arms if enabled */}
                {config.spraySystem && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <rect x="42" y="100" width="116" height="4" rx="2" fill="#60a5fa" />
                    {[0, 1, 2, 3, 4].map((i) => (
                      <g key={i}>
                        <circle cx={52 + i * 24} cy="108" r="4" fill="#3b82f6" />
                        <motion.path
                          d={`M${52 + i * 24} 112 L${47 + i * 24} 126 L${57 + i * 24} 126 Z`}
                          fill="#93c5fd"
                          opacity={0.5}
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                        />
                      </g>
                    ))}
                  </motion.g>
                )}

                {/* Back Wheels */}
                <circle cx="60" cy="120" r="16" fill="#374151" />
                <circle cx="60" cy="120" r="9" fill="#6b7280" />
                <circle cx="140" cy="120" r="16" fill="#374151" />
                <circle cx="140" cy="120" r="9" fill="#6b7280" />

                {/* Front wheels based on config */}
                {config.frontWheel === "DFW" ? (
                  <>
                    <circle cx="60" cy="140" r="10" fill="#374151" />
                    <circle cx="60" cy="140" r="6" fill="#6b7280" />
                    <circle cx="140" cy="140" r="10" fill="#374151" />
                    <circle cx="140" cy="140" r="6" fill="#6b7280" />
                  </>
                ) : (
                  <>
                    <circle cx="100" cy="135" r="12" fill="#374151" />
                    <circle cx="100" cy="135" r="7" fill="#6b7280" />
                    {config.frontWheel === "AFW" && (
                      <motion.circle
                        cx="100" cy="135" r="4" fill="#f59e0b"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </>
                )}
              </svg>
            </motion.div>
          </div>

          {/* Config summary row */}
          <div className="flex justify-center gap-6 md:gap-8 pt-4 md:pt-6 border-t border-stone-100">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-semibold text-stone-900">
                {config.activeRows}
                <span className="text-sm md:text-base font-normal text-stone-400 ml-0.5">{t("configLabels.rows")}</span>
              </p>
              <p className="text-xs text-stone-500 mt-0.5">{t("configLabels.active")}</p>
            </div>
            <div className="text-center">
              <p className="text-xl md:text-2xl font-semibold text-stone-900">
                {(workingWidth / 10).toFixed(0)}
                <span className="text-sm md:text-base font-normal text-stone-400 ml-0.5">cm</span>
              </p>
              <p className="text-xs text-stone-500 mt-0.5">{t("configLabels.workingWidth")}</p>
            </div>
            <div className="text-center">
              <p className="text-xl md:text-2xl font-semibold text-stone-900">
                {config.powerSource === "hybrid" ? t("configLabels.hybrid") : t("configLabels.solar")}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">{t("configLabels.power")}</p>
            </div>
          </div>
        </div>

        {/* Right: Customer Info + Partner Actions - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer info form */}
          <LeadCaptureForm
            config={config}
            priceBreakdown={priceBreakdown}
            onSubmit={(lead) => {
              setLeadData(lead);
              toast.info("Customer details saved", "You can now save or share the quote");
            }}
            initialLead={initialLead}
            startAsRecognized={Boolean(initialLead)}
            heading="Customer Details"
            subheading="Enter your customer's information to create a quote — prices are shown below."
          />

          {/* Partner Actions with lead data */}
          <PartnerActions
            config={config}
            priceBreakdown={priceBreakdown}
            onRestart={handleRestart}
            onShareQuote={() => setShowQuoteModal(true)}
            lead={leadData}
          />
        </div>
      </div>

      {/* Modals (only shown in partner mode) */}
      <AnimatePresence>
        {showEmailModal && (
          <EmailQuoteModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            config={config}
            priceBreakdown={priceBreakdown}
          />
        )}
        {showDealModal && (
          <CreateDealModal
            isOpen={showDealModal}
            onClose={() => setShowDealModal(false)}
            config={config}
            priceBreakdown={priceBreakdown}
          />
        )}
      </AnimatePresence>

      {/* Quote Customization Modal */}
      <QuoteCustomizationModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        config={config}
        priceBreakdown={priceBreakdown}
        locale={locale}
      />
    </>
  );
}
