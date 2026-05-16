"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronDown, Search, Pencil, ArrowRight, Mail, UserCheck } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { ConfiguratorState, PriceBreakdown, calculatePrice } from "@/lib/configurator-data";

// Primary FarmDroid markets (shown first in dropdown)
const PRIMARY_COUNTRIES = [
  "Denmark",
  "Germany",
  "Netherlands",
  "Sweden",
  "Norway",
  "Finland",
  "France",
  "United Kingdom",
  "Poland",
  "Austria",
  "Switzerland",
  "Belgium",
] as const;

// All countries (matching HubSpot values)
const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau",
  "Macedonia (FYROM)", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain",
  "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe"
] as const;

// Other countries (all except primary, for "Other countries" section)
const OTHER_COUNTRIES = ALL_COUNTRIES.filter(c => !PRIMARY_COUNTRIES.includes(c as typeof PRIMARY_COUNTRIES[number]));

// Country dial codes
const COUNTRY_DIAL_CODES: Record<string, string> = {
  "Afghanistan": "+93", "Albania": "+355", "Algeria": "+213", "Andorra": "+376", "Angola": "+244",
  "Argentina": "+54", "Armenia": "+374", "Australia": "+61", "Austria": "+43", "Azerbaijan": "+994",
  "Bahamas": "+1-242", "Bahrain": "+973", "Bangladesh": "+880", "Barbados": "+1-246", "Belarus": "+375",
  "Belgium": "+32", "Belize": "+501", "Benin": "+229", "Bhutan": "+975", "Bolivia": "+591",
  "Bosnia and Herzegovina": "+387", "Botswana": "+267", "Brazil": "+55", "Brunei": "+673",
  "Bulgaria": "+359", "Burkina Faso": "+226", "Burundi": "+257", "Cambodia": "+855", "Cameroon": "+237",
  "Canada": "+1", "Cape Verde": "+238", "Central African Republic": "+236", "Chad": "+235",
  "Chile": "+56", "China": "+86", "Colombia": "+57", "Comoros": "+269", "Congo": "+242",
  "Costa Rica": "+506", "Cote d'Ivoire": "+225", "Croatia": "+385", "Cuba": "+53", "Cyprus": "+357",
  "Czech Republic": "+420", "Democratic Republic of the Congo": "+243", "Denmark": "+45",
  "Djibouti": "+253", "Dominica": "+1-767", "Dominican Republic": "+1-809", "East Timor": "+670",
  "Ecuador": "+593", "Egypt": "+20", "El Salvador": "+503", "Equatorial Guinea": "+240",
  "Eritrea": "+291", "Estonia": "+372", "Ethiopia": "+251", "Fiji": "+679", "Finland": "+358",
  "France": "+33", "Gabon": "+241", "Gambia": "+220", "Georgia": "+995", "Germany": "+49",
  "Ghana": "+233", "Greece": "+30", "Grenada": "+1-473", "Guatemala": "+502", "Guinea": "+224",
  "Guinea-Bissau": "+245", "Guyana": "+592", "Haiti": "+509", "Honduras": "+504", "Hong Kong": "+852",
  "Hungary": "+36", "Iceland": "+354", "India": "+91", "Indonesia": "+62", "Iran": "+98",
  "Iraq": "+964", "Ireland": "+353", "Israel": "+972", "Italy": "+39", "Jamaica": "+1-876",
  "Japan": "+81", "Jordan": "+962", "Kazakhstan": "+7", "Kenya": "+254", "Kiribati": "+686",
  "Kosovo": "+383", "Kuwait": "+965", "Kyrgyzstan": "+996", "Laos": "+856", "Latvia": "+371",
  "Lebanon": "+961", "Lesotho": "+266", "Liberia": "+231", "Libya": "+218", "Liechtenstein": "+423",
  "Lithuania": "+370", "Luxembourg": "+352", "Macau": "+853", "Macedonia (FYROM)": "+389",
  "Madagascar": "+261", "Malawi": "+265", "Malaysia": "+60", "Maldives": "+960", "Mali": "+223",
  "Malta": "+356", "Marshall Islands": "+692", "Mauritania": "+222", "Mauritius": "+230",
  "Mexico": "+52", "Micronesia": "+691", "Moldova": "+373", "Monaco": "+377", "Mongolia": "+976",
  "Montenegro": "+382", "Morocco": "+212", "Mozambique": "+258", "Myanmar (Burma)": "+95",
  "Namibia": "+264", "Nauru": "+674", "Nepal": "+977", "Netherlands": "+31", "New Zealand": "+64",
  "Nicaragua": "+505", "Niger": "+227", "Nigeria": "+234", "North Korea": "+850", "Norway": "+47",
  "Oman": "+968", "Pakistan": "+92", "Palau": "+680", "Palestine": "+970", "Panama": "+507",
  "Papua New Guinea": "+675", "Paraguay": "+595", "Peru": "+51", "Philippines": "+63",
  "Poland": "+48", "Portugal": "+351", "Qatar": "+974", "Romania": "+40", "Russia": "+7",
  "Rwanda": "+250", "Saint Kitts and Nevis": "+1-869", "Saint Lucia": "+1-758",
  "Saint Vincent and the Grenadines": "+1-784", "Samoa": "+685", "San Marino": "+378",
  "Sao Tome and Principe": "+239", "Saudi Arabia": "+966", "Senegal": "+221", "Serbia": "+381",
  "Seychelles": "+248", "Sierra Leone": "+232", "Singapore": "+65", "Slovakia": "+421",
  "Slovenia": "+386", "Solomon Islands": "+677", "Somalia": "+252", "South Africa": "+27",
  "South Korea": "+82", "South Sudan": "+211", "Spain": "+34", "Sri Lanka": "+94", "Sudan": "+249",
  "Suriname": "+597", "Swaziland": "+268", "Sweden": "+46", "Switzerland": "+41", "Syria": "+963",
  "Taiwan": "+886", "Tajikistan": "+992", "Tanzania": "+255", "Thailand": "+66", "Togo": "+228",
  "Tonga": "+676", "Trinidad and Tobago": "+1-868", "Tunisia": "+216", "Turkey": "+90",
  "Turkmenistan": "+993", "Tuvalu": "+688", "Uganda": "+256", "Ukraine": "+380",
  "United Arab Emirates": "+971", "United Kingdom": "+44", "United States": "+1", "Uruguay": "+598",
  "Uzbekistan": "+998", "Vanuatu": "+678", "Vatican City": "+379", "Venezuela": "+58",
  "Vietnam": "+84", "Yemen": "+967", "Zambia": "+260", "Zimbabwe": "+263"
};

// Crop types: key for translations, value for HubSpot internal name
const CROP_TYPES: Record<string, string> = {
  "Brassica": "Brassica - Kohl - Brassica - Kool - Kål",
  "Herbs": "Herbs - Kräuter - Herbes - Kruiden - Krydderurter",
  "Cereals": "Cereals - Getreide - Céréales - Granen - Korn",
  "Fodder beet": "Fodder beet - Futterrübe - Betterave fourragère - Voederbiet - Foderroe",
  "Sugar beet": "Sugar beet - Zuckerrübe - Betterave sucrière - Suikerbiet - Sukkerroe",
  "Red beet": "Red beet - Rote Bete - Betterave rouge - Rode biet - Rødbede",
  "Onion": "Onion - Zwiebel - Oignon - Ui - Løg",
  "Endives": "Endives - Endivie - Endive - Andijvie - Endivie",
  "Chicory": "Chicory - Zichorie - Chicorée - Cichorei - Cikorie",
  "Canola/Rape seed": "Canola/Rape seed - Raps - Colza - Koolzaad - Raps",
  "Carrot": "Carrot - Karotte/Möhre - Carotte - Wortel - Gulerod",
  "Field beans": "Field beans - Ackerbohne - Fève - Veldboon - Hestebønne",
  "Peas": "Peas - Erbse - Pois - Erwt - Ært",
  "Chickpea": "Chickpea - Kichererbse - Pois chiche - Kikkererwt - Kikært",
  "Soy bean": "Soy bean - Sojabohne - Soja - Sojaboon - Sojabønne",
  "Lupin": "Lupin - Lupine - Lupin - Lupine - Lupin",
  "Lentils": "Lentils - Linse - Lentille - Linze - Linse",
  "Fodder corn": "Fodder corn - Futtermais - Maïs fourrager - Voedermaïs - Fodermajs",
  "Sweet corn": "Sweet corn - Zuckermais - Maïs doux - Suikermaïs - majs",
  "Pumpkin": "Pumpkin - Kürbis - Potiron/Citrouille - Pompoen - Græskar",
  "Quinoa": "Quinoa - Quinoa - Quinoa - Quinoa - Quinoa",
  "Sunflower": "Sunflower - Sonnenblume - Tournesol - Zonnebloem - Solsikke",
  "Lettuce": "Lettuce - Salat - Laitue - Sla - Salat",
};

export interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  company: string;
  isFarmer: string;
  farmingType: string;
  farmSize: string;
  hectaresForFarmDroid: string;
  crops: string;
  otherCrops: string;
  contactByPartner: boolean;
  marketingConsent: boolean;
}

type EmailPhase = "entering" | "checking" | "recognized" | "new";

interface MaskedHints {
  maskedName: string;
  maskedPhone: string;
  maskedCompany: string;
}

interface LeadCaptureFormProps {
  config: ConfiguratorState;
  priceBreakdown: PriceBreakdown;
  onSubmit: (lead: LeadData) => void;
  initialLead?: LeadData | null;
  /** When true, form starts in "recognized" state: data shown in disabled fields with Edit/Go buttons */
  startAsRecognized?: boolean;
  /** Override heading text (used in dealer/partner mode for customer-focused copy) */
  heading?: string;
  /** Override subheading text */
  subheading?: string;
}

export function LeadCaptureForm({ config, priceBreakdown, onSubmit, initialLead, startAsRecognized, heading, subheading }: LeadCaptureFormProps) {
  const tPublic = useTranslations("publicMode");
  const t = useTranslations("publicMode.form");
  const tEmail = useTranslations("publicMode.emailFirst");
  const locale = useLocale();

  // Determine if we're in pre-filled mode (edit mode with existing reference)
  // In this case, email is locked and fields are immediately enabled
  const isEditMode = Boolean(initialLead && initialLead.firstName && !startAsRecognized);
  // Legacy alias
  const isPreFilledMode = isEditMode;

  const [formData, setFormData] = useState<LeadData>(initialLead || {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    region: "",
    company: "",
    isFarmer: "",
    farmingType: "",
    farmSize: "",
    hectaresForFarmDroid: "",
    crops: "",
    otherCrops: "",
    contactByPartner: false,
    marketingConsent: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LeadData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LeadData, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [cropsDropdownOpen, setCropsDropdownOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const cropsDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countrySearchRef = useRef<HTMLInputElement>(null);

  // Email-first lookup state
  const [emailPhase, setEmailPhase] = useState<EmailPhase>(
    startAsRecognized ? "recognized" : isPreFilledMode ? "new" : "entering"
  );
  const [maskedHints, setMaskedHints] = useState<MaskedHints | null>(null);
  const [lastLookedUpEmail, setLastLookedUpEmail] = useState<string | null>(null);
  const [latestReference, setLatestReference] = useState<string | null>(null);

  // Whether the rest of the form fields should be enabled
  // Fields stay disabled in "recognized" phase until user clicks "Edit your information"
  const fieldsEnabled = isPreFilledMode || emailPhase === "new";

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cropsDropdownRef.current && !cropsDropdownRef.current.contains(event.target as Node)) {
        setCropsDropdownOpen(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
        setCountrySearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when country dropdown opens
  useEffect(() => {
    if (countryDropdownOpen && countrySearchRef.current) {
      countrySearchRef.current.focus();
    }
  }, [countryDropdownOpen]);

  // Filter countries based on search (searches anywhere in the name)
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return ALL_COUNTRIES;
    const search = countrySearch.toLowerCase();
    return ALL_COUNTRIES.filter(country =>
      country.toLowerCase().includes(search)
    );
  }, [countrySearch]);

  // Get country dial code
  const getDialCode = (country: string): string => {
    return COUNTRY_DIAL_CODES[country] || "";
  };

  // Get selected crops as array (HubSpot internal values)
  const selectedCropsHubspot = formData.crops ? formData.crops.split(";").map(s => s.trim()).filter(Boolean) : [];

  // Get crop key from HubSpot value
  const getCropKeyFromHubspot = (hubspotValue: string): string | undefined => {
    return Object.keys(CROP_TYPES).find(key => CROP_TYPES[key] === hubspotValue);
  };

  // Check if a crop (by key) is selected
  const isCropSelected = (cropKey: string): boolean => {
    return selectedCropsHubspot.includes(CROP_TYPES[cropKey]);
  };

  // Toggle crop selection (stores HubSpot internal values)
  const toggleCrop = (cropKey: string) => {
    const hubspotValue = CROP_TYPES[cropKey];
    const newCrops = isCropSelected(cropKey)
      ? selectedCropsHubspot.filter(c => c !== hubspotValue)
      : [...selectedCropsHubspot, hubspotValue];
    handleChange("crops", newCrops.join(";"));
  };

  // Get display names for selected crops
  const getSelectedCropsDisplay = (): string => {
    return selectedCropsHubspot
      .map(hv => getCropKeyFromHubspot(hv))
      .filter(Boolean)
      .map(key => t(`cropTypes.${key}`))
      .join(", ");
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateField = (field: keyof LeadData, value: string | boolean) => {
    switch (field) {
      case "firstName":
        return typeof value === "string" && value.trim() === "" ? t("errors.firstNameRequired") : "";
      case "lastName":
        return typeof value === "string" && value.trim() === "" ? t("errors.lastNameRequired") : "";
      case "email":
        if (typeof value !== "string" || value.trim() === "") return t("errors.emailRequired");
        if (!isValidEmail(value)) return t("errors.emailInvalid");
        return "";
      case "company":
        return typeof value === "string" && value.trim() === "" ? t("errors.companyRequired") : "";
      case "country":
        return typeof value === "string" && value === "" ? t("errors.countryRequired") : "";
      case "isFarmer":
        return typeof value === "string" && value === "" ? t("errors.isFarmerRequired") : "";
      default:
        return "";
    }
  };

  const handleChange = (field: keyof LeadData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: keyof LeadData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, formData[field]) }));
  };

  // Email lookup logic
  const lookupEmail = useCallback(async (email: string) => {
    if (!isValidEmail(email)) return;
    if (email === lastLookedUpEmail) return;

    setEmailPhase("checking");
    setLastLookedUpEmail(email);

    try {
      const response = await fetch("/api/email-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setEmailPhase("new");
        return;
      }

      const data = await response.json();

      if (data.hasConfigurations && data.leadData) {
        setMaskedHints({
          maskedName: data.leadData.maskedName,
          maskedPhone: data.leadData.maskedPhone,
          maskedCompany: data.leadData.maskedCompany,
        });
        setLatestReference(data.latestReference || null);
        // Auto-pre-fill the form immediately
        setFormData(prev => ({
          ...prev,
          firstName: (data.leadData.firstName as string) || "",
          lastName: (data.leadData.lastName as string) || "",
          phone: (data.leadData.phone as string) || "",
          country: (data.leadData.country as string) || "",
          region: (data.leadData.region as string) || "",
          company: (data.leadData.company as string) || "",
          isFarmer: (data.leadData.isFarmer as string) || "",
          farmingType: (data.leadData.farmingType as string) || "",
          farmSize: (data.leadData.farmSize as string) || "",
          hectaresForFarmDroid: (data.leadData.hectaresForFarmDroid as string) || "",
          crops: (data.leadData.crops as string) || "",
          otherCrops: (data.leadData.otherCrops as string) || "",
          contactByPartner: (data.leadData.contactByPartner as boolean) ?? false,
          marketingConsent: (data.leadData.marketingConsent as boolean) ?? false,
        }));
        setEmailPhase("recognized");
      } else {
        setEmailPhase("new");
      }
    } catch {
      setEmailPhase("new");
    }
  }, [lastLookedUpEmail]);

  // Handle email blur — trigger lookup
  const handleEmailBlur = () => {
    handleBlur("email");
    if (!isPreFilledMode && !startAsRecognized && isValidEmail(formData.email)) {
      lookupEmail(formData.email);
    }
  };

  // Handle email change — reset if email changes after lookup
  const handleEmailChange = (value: string) => {
    handleChange("email", value);
    if (emailPhase === "recognized" || emailPhase === "new") {
      if (value !== lastLookedUpEmail) {
        setEmailPhase("entering");
        setMaskedHints(null);
        setLatestReference(null);
        setLastLookedUpEmail(null);
        // Reset form fields to blank when email changes
        setFormData(prev => ({
          ...prev,
          email: value,
          firstName: "",
          lastName: "",
          phone: "",
          country: "",
          region: "",
          company: "",
          isFarmer: "",
          farmingType: "",
          farmSize: "",
          hectaresForFarmDroid: "",
          crops: "",
          otherCrops: "",
          contactByPartner: false,
          marketingConsent: false,
        }));
      }
    }
  };

  // "Edit your information" — pre-fill form and enable fields for editing
  const handleEditInfo = () => {
    // Form data is already pre-filled from the lookup callback
    // Just transition to "new" phase so fields become enabled
    setEmailPhase("new");
  };

  // "Go to configuration" — immediately submit with pre-filled data to create the new config
  const handleGoToConfig = () => {
    setSubmitting(true);
    onSubmit(formData);
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof LeadData, string>> = {};
    const requiredFields: (keyof LeadData)[] = ["isFarmer", "firstName", "lastName", "email", "company", "country"];

    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    setTouched(
      requiredFields.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {} as Partial<Record<keyof LeadData, boolean>>
      )
    );

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    // Call parent handler - parent will handle loading state and API call
    onSubmit(formData);
    // Note: We don't setSubmitting(false) here - the parent controls the flow now
  };

  const inputClasses = (field: keyof LeadData) =>
    `w-full h-11 px-4 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:border-transparent ${
      errors[field] && touched[field]
        ? "border-red-400 focus:ring-red-500"
        : "border-stone-200 focus:ring-stone-900"
    }`;

  // When in "entering"/"checking" phase, fields are fully grayed out (no data yet)
  // When in "recognized" phase, fields have pre-filled data so they should be readable but non-interactive
  const disabledFieldClasses = emailPhase === "recognized"
    ? "opacity-75 pointer-events-none"
    : "opacity-50 bg-stone-50 cursor-not-allowed pointer-events-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900">{heading || tPublic("formHeading")}</h2>
        <p className="text-sm text-stone-500 mt-1">{subheading || tPublic("formSubheading")}</p>
      </div>

      {/* Email — First field, always enabled */}
      <div>
        <label className="text-sm font-medium text-stone-700">
          {t("email")} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <Mail className="h-4 w-4" />
          </div>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={handleEmailBlur}
            className={`${inputClasses("email")} pl-10`}
            placeholder={tEmail("enterEmail")}
            readOnly={isPreFilledMode || startAsRecognized}
            autoFocus={!isPreFilledMode && !startAsRecognized}
          />
          {emailPhase === "checking" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
            </div>
          )}
        </div>
        {errors.email && touched.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        {!isPreFilledMode && emailPhase === "entering" && !errors.email && (
          <p className="mt-1.5 text-xs text-stone-400">{tEmail("enterEmailHint")}</p>
        )}
      </div>

      {/* Recognized user banner */}
      <AnimatePresence>
        {emailPhase === "recognized" && (maskedHints || startAsRecognized) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-800">
                    {tEmail("welcomeBack")}
                  </p>
                  <p className="text-sm text-emerald-700 mt-0.5">
                    {maskedHints ? (
                      <>
                        {maskedHints.maskedName}
                        {maskedHints.maskedCompany && ` · ${maskedHints.maskedCompany}`}
                        {maskedHints.maskedPhone && ` · ${maskedHints.maskedPhone}`}
                      </>
                    ) : (
                      <>
                        {formData.firstName} {formData.lastName}
                        {formData.company && ` · ${formData.company}`}
                      </>
                    )}
                  </p>
                  <div className="flex gap-3 mt-2.5">
                    <button
                      type="button"
                      onClick={handleGoToConfig}
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-md transition-colors"
                    >
                      {submitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                      {tEmail("goToConfig")}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditInfo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 border border-emerald-300 hover:border-emerald-400 rounded-md transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {tEmail("editInfo")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest of the form — disabled until email is resolved */}
      <div className={!fieldsEnabled ? disabledFieldClasses : "transition-opacity duration-300"}>
        {/* Country */}
        <div ref={countryDropdownRef} className="mb-5">
          <label className="text-sm font-medium text-stone-700">
            {t("country")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => fieldsEnabled && setCountryDropdownOpen(!countryDropdownOpen)}
              onBlur={() => !countryDropdownOpen && handleBlur("country")}
              disabled={!fieldsEnabled}
              className={`${inputClasses("country")} appearance-none cursor-pointer text-left flex items-center justify-between disabled:bg-stone-50 disabled:cursor-not-allowed`}
            >
              <span className={formData.country ? "text-stone-900" : "text-stone-400"}>
                {formData.country || t("selectCountry")}
              </span>
              <ChevronDown className={`h-5 w-5 text-stone-400 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {countryDropdownOpen && fieldsEnabled && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg">
                <div className="p-2 border-b border-stone-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      ref={countrySearchRef}
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder={t("searchCountry")}
                      className="w-full h-9 pl-9 pr-3 rounded-md border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-stone-400">{t("noCountriesFound")}</div>
                  ) : (
                    filteredCountries.map((country) => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => {
                          handleChange("country", country);
                          setCountryDropdownOpen(false);
                          setCountrySearch("");
                          handleBlur("country");
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-stone-50 flex items-center justify-between ${
                          formData.country === country ? "bg-stone-100 font-medium" : ""
                        }`}
                      >
                        <span>{country}</span>
                        <span className="text-stone-400 text-xs">{getDialCode(country)}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.country && touched.country && (
            <p className="mt-1 text-xs text-red-500">{errors.country}</p>
          )}
        </div>

        {/* Are you a farmer? */}
        <div className="mb-5">
          <label className="text-sm font-medium text-stone-700">
            {t("isFarmer")} <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="isFarmer"
                value="yes"
                checked={formData.isFarmer === "yes"}
                onChange={(e) => handleChange("isFarmer", e.target.value)}
                disabled={!fieldsEnabled}
                className="h-4 w-4 text-stone-900 border-stone-300 focus:ring-stone-900 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                {t("yes")}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="isFarmer"
                value="no"
                checked={formData.isFarmer === "no"}
                onChange={(e) => handleChange("isFarmer", e.target.value)}
                disabled={!fieldsEnabled}
                className="h-4 w-4 text-stone-900 border-stone-300 focus:ring-stone-900 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                {t("no")}
              </span>
            </label>
          </div>
          {errors.isFarmer && touched.isFarmer && (
            <p className="mt-1 text-xs text-red-500">{errors.isFarmer}</p>
          )}
        </div>

        {/* Name Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-sm font-medium text-stone-700">
              {t("firstName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              disabled={!fieldsEnabled}
              className={`${inputClasses("firstName")} disabled:bg-stone-50 disabled:cursor-not-allowed`}
            />
            {errors.firstName && touched.firstName && (
              <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">
              {t("lastName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              disabled={!fieldsEnabled}
              className={`${inputClasses("lastName")} disabled:bg-stone-50 disabled:cursor-not-allowed`}
            />
            {errors.lastName && touched.lastName && (
              <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="mb-5">
          <label className="text-sm font-medium text-stone-700">{t("phone")}</label>
          <div className="flex">
            <div className="flex items-center px-3 bg-stone-100 border border-r-0 border-stone-200 rounded-l-lg text-sm text-stone-600 min-w-[70px] justify-center">
              {formData.country ? getDialCode(formData.country) || "—" : "—"}
            </div>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={!fieldsEnabled}
              className="flex-1 h-11 px-4 rounded-r-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent disabled:bg-stone-50 disabled:cursor-not-allowed"
              placeholder={t("phonePlaceholder")}
            />
          </div>
        </div>

        {/* Region */}
        <div className="mb-5">
          <label className="text-sm font-medium text-stone-700">{t("region")}</label>
          <input
            type="text"
            value={formData.region}
            onChange={(e) => handleChange("region", e.target.value)}
            disabled={!fieldsEnabled}
            className="w-full h-11 px-4 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent disabled:bg-stone-50 disabled:cursor-not-allowed"
            placeholder={t("regionPlaceholder")}
          />
        </div>

        {/* Company / Farm Name */}
        <div className="mb-5">
          <label className="text-sm font-medium text-stone-700">
            {t("company")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => handleChange("company", e.target.value)}
            onBlur={() => handleBlur("company")}
            disabled={!fieldsEnabled}
            className={`${inputClasses("company")} disabled:bg-stone-50 disabled:cursor-not-allowed`}
          />
          {errors.company && touched.company && (
            <p className="mt-1 text-xs text-red-500">{errors.company}</p>
          )}
        </div>

        {/* Organic or Conventional? */}
        <div className={`mb-5 ${formData.isFarmer === "no" ? "opacity-50" : ""}`}>
          <label className="text-sm font-medium text-stone-700">{t("farmingType")}</label>
          <div className="flex gap-6 mt-2">
            <label className={`flex items-center gap-2 group ${!fieldsEnabled || formData.isFarmer === "no" ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="radio"
                name="farmingType"
                value="Conventional"
                checked={formData.farmingType === "Conventional"}
                onChange={(e) => handleChange("farmingType", e.target.value)}
                disabled={!fieldsEnabled || formData.isFarmer === "no"}
                className="h-4 w-4 text-stone-900 border-stone-300 focus:ring-stone-900 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                {t("farmingTypes.conventional")}
              </span>
            </label>
            <label className={`flex items-center gap-2 group ${!fieldsEnabled || formData.isFarmer === "no" ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="radio"
                name="farmingType"
                value="Organic"
                checked={formData.farmingType === "Organic"}
                onChange={(e) => handleChange("farmingType", e.target.value)}
                disabled={!fieldsEnabled || formData.isFarmer === "no"}
                className="h-4 w-4 text-stone-900 border-stone-300 focus:ring-stone-900 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                {t("farmingTypes.organic")}
              </span>
            </label>
            <label className={`flex items-center gap-2 group ${!fieldsEnabled || formData.isFarmer === "no" ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="radio"
                name="farmingType"
                value="Both"
                checked={formData.farmingType === "Both"}
                onChange={(e) => handleChange("farmingType", e.target.value)}
                disabled={!fieldsEnabled || formData.isFarmer === "no"}
                className="h-4 w-4 text-stone-900 border-stone-300 focus:ring-stone-900 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                {t("farmingTypes.both")}
              </span>
            </label>
          </div>
        </div>

        {/* Farm Size */}
        <div className={`mb-5 ${formData.isFarmer === "no" ? "opacity-50" : ""}`}>
          <label className="text-sm font-medium text-stone-700">{t("farmSize")}</label>
          <input
            type="number"
            value={formData.farmSize}
            onChange={(e) => handleChange("farmSize", e.target.value)}
            disabled={!fieldsEnabled || formData.isFarmer === "no"}
            className="w-full h-11 px-4 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
            placeholder={t("farmSizePlaceholder")}
            min="0"
          />
        </div>

        {/* Hectares relevant for FarmDroid */}
        <div className={`mb-5 ${formData.isFarmer === "no" ? "opacity-50" : ""}`}>
          <label className="text-sm font-medium text-stone-700">{t("hectaresForFarmDroid")}</label>
          <input
            type="number"
            value={formData.hectaresForFarmDroid}
            onChange={(e) => handleChange("hectaresForFarmDroid", e.target.value)}
            disabled={!fieldsEnabled || formData.isFarmer === "no"}
            className="w-full h-11 px-4 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
            placeholder={t("hectaresPlaceholder")}
            min="0"
          />
          <p className="mt-1 text-xs text-stone-400">{t("hectaresHint")}</p>
        </div>

        {/* Crops - Multi-select */}
        <div className={`mb-5 ${formData.isFarmer === "no" ? "opacity-50" : ""}`} ref={cropsDropdownRef}>
          <label className="text-sm font-medium text-stone-700">{t("crops")}</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => fieldsEnabled && (!formData.isFarmer || formData.isFarmer !== "no") ? setCropsDropdownOpen(!cropsDropdownOpen) : null}
              disabled={!fieldsEnabled || formData.isFarmer === "no"}
              className="w-full h-11 px-4 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed text-left flex items-center justify-between"
            >
              <span className={selectedCropsHubspot.length === 0 ? "text-stone-400" : "text-stone-900 truncate"}>
                {selectedCropsHubspot.length === 0
                  ? t("selectCrops")
                  : getSelectedCropsDisplay()}
              </span>
              <ChevronDown className={`h-5 w-5 text-stone-400 transition-transform ${cropsDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {cropsDropdownOpen && fieldsEnabled && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {Object.keys(CROP_TYPES).map((cropKey) => (
                  <label
                    key={cropKey}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-stone-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isCropSelected(cropKey)}
                      onChange={() => toggleCrop(cropKey)}
                      className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                    />
                    <span className="text-sm text-stone-700">{t(`cropTypes.${cropKey}`)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Other Crops - Free text */}
        <div className={`mb-5 ${formData.isFarmer === "no" ? "opacity-50" : ""}`}>
          <label className="text-sm font-medium text-stone-700">{t("otherCrops")}</label>
          <input
            type="text"
            value={formData.otherCrops}
            onChange={(e) => handleChange("otherCrops", e.target.value)}
            disabled={!fieldsEnabled || formData.isFarmer === "no"}
            className="w-full h-11 px-4 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent disabled:bg-stone-100 disabled:cursor-not-allowed"
            placeholder={t("otherCropsPlaceholder")}
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.contactByPartner}
              onChange={(e) => handleChange("contactByPartner", e.target.checked)}
              disabled={!fieldsEnabled}
              className="mt-0.5 h-5 w-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
              {t("contactByPartner")}
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.marketingConsent}
              onChange={(e) => handleChange("marketingConsent", e.target.checked)}
              disabled={!fieldsEnabled}
              className="mt-0.5 h-5 w-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
              {t("marketingConsent")}
            </span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || !fieldsEnabled}
        className="w-full h-12 mt-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium flex items-center justify-center gap-2 transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("sending")}
          </>
        ) : (
          <>
            {tPublic("submitButton")}
            <span className="ml-1">→</span>
          </>
        )}
      </button>

      <p className="text-xs text-stone-400 text-center">
        {t("privacyNote")}
      </p>
    </form>
  );
}
