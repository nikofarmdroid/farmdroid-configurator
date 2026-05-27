import pako from "pako";
import { ConfigPageData, CONFIG_PAGE_VERSION } from "./config-page-types";
import { LeadData } from "@/components/configurator/lead-capture-form";

/**
 * Encode lead data to a URL-safe string (for start fresh with known contact)
 */
export function encodeLeadData(lead: LeadData): string {
  try {
    const json = JSON.stringify(lead);
    const compressed = pako.deflate(json);
    const base64 = btoa(String.fromCharCode(...compressed))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return base64;
  } catch (error) {
    console.error("Failed to encode lead data:", error);
    throw new Error("Failed to encode lead data");
  }
}

/**
 * Decode lead data from URL-safe string
 */
export function decodeLeadData(encoded: string): LeadData | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = pako.inflate(bytes, { to: "string" });
    return JSON.parse(json) as LeadData;
  } catch (error) {
    console.error("Failed to decode lead data:", error);
    return null;
  }
}

/**
 * Generate a short, memorable reference code
 * Format: FD-XXXXXXXXXXXX (12 alphanumeric chars after prefix)
 * Uses only unambiguous characters (no 0/O, 1/I/L)
 */
export function generateConfigReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "FD-";
  const values = new Uint32Array(12);
  globalThis.crypto.getRandomValues(values);

  for (let i = 0; i < values.length; i++) {
    result += chars.charAt(values[i] % chars.length);
  }
  return result;
}

/**
 * Encode config page data to a URL-safe string
 */
export function encodeConfigPageData(data: ConfigPageData): string {
  try {
    const json = JSON.stringify(data);
    const compressed = pako.deflate(json);

    // Convert to base64 and make URL-safe
    const base64 = btoa(String.fromCharCode(...compressed))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return base64;
  } catch (error) {
    console.error("Failed to encode config page data:", error);
    throw new Error("Failed to encode config page data");
  }
}

/**
 * Decode config page data from URL-safe string
 */
export function decodeConfigPageData(encoded: string): ConfigPageData | null {
  try {
    // Convert from URL-safe base64
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const json = pako.inflate(bytes, { to: "string" });
    const data = JSON.parse(json) as ConfigPageData;

    // Validate version
    if (data.version > CONFIG_PAGE_VERSION) {
      console.warn("Config page data version is newer than supported");
    }

    return data;
  } catch (error) {
    console.error("Failed to decode config page data:", error);
    return null;
  }
}

/**
 * Generate a shareable config page URL
 */
export function generateConfigPageUrl(data: ConfigPageData, baseUrl: string): string {
  const encoded = encodeConfigPageData(data);
  const url = new URL(`/${data.locale}/config/${data.reference}`, baseUrl);
  url.searchParams.set("d", encoded);
  return url.toString();
}

/**
 * Generate mailto: link for sharing configuration
 */
export function generateShareEmailUrl(
  configUrl: string,
  firstName: string,
  reference: string
): string {
  const subject = encodeURIComponent(`Your FarmDroid Configuration - ${reference}`);
  const body = encodeURIComponent(
    `Hi ${firstName},\n\nHere's your personalized FarmDroid configuration:\n\n${configUrl}\n\nYou can view your configuration anytime using this link.`
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Format date for display
 */
export function formatConfigDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === "en" ? "en-GB" : locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
