import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  calculatePrice,
  type ConfiguratorState,
  type Currency,
} from "@/lib/configurator-data";

export const MAX_CONFIGURATION_BODY_BYTES = 64 * 1024;
const VERIFIED_EMAIL_COOKIE = "fd_verified_email";
const VERIFIED_EMAIL_TTL_SECONDS = 30 * 60;

const stringField = z.string().trim().max(500);
const optionalStringField = z.string().trim().max(1000).optional().default("");

const acceptedCurrencySchema = z.enum(["EUR", "SEK", "DKK"]);

const configSchema = z.object({
  currency: acceptedCurrencySchema,
  measurementUnit: z.enum(["cm", "in"]),
  baseRobot: z.literal(true),
  powerSource: z.enum(["solar", "hybrid"]),
  frontWheel: z.enum(["PFW", "AFW", "DFW"]),
  wheelSpacing: z.number().int().min(1500).max(2500),
  rowPlacementMode: z.enum(["bed", "field", "custom"]),
  seedSize: z.enum(["6mm", "14mm"]),
  activeRows: z.number().int().min(1).max(12),
  rowDistance: z.number().int().min(100).max(2000),
  rowSpacings: z.array(z.number().int().min(100).max(2000)).max(11),
  rowsOutsideLeft: z.number().int().min(0).max(12),
  rowsOutsideRight: z.number().int().min(0).max(12),
  seedingMode: z.enum(["single", "group", "line"]),
  plantSpacing: z.number().min(1).max(1000),
  seedsPerGroup: z.number().int().min(1).max(15),
  workingWidth: z.number().int().min(1).max(10000),
  cropEmoji: z.string().trim().max(32),
  spraySystem: z.boolean(),
  weedingTool: z.enum(["none", "combiTool", "weedCuttingDisc"]),
  starterKit: z.boolean(),
  roadTransport: z.boolean(),
  fieldBracket: z.boolean(),
  powerBank: z.boolean(),
  fstFieldSetupTool: z.boolean(),
  baseStationV3: z.boolean(),
  essentialCarePackage: z.boolean(),
  essentialCareSpray: z.boolean(),
  additionalWeightKit: z.boolean(),
  toolbox: z.boolean(),
  servicePlan: z.enum(["none", "standard", "premium"]),
  warrantyExtension: z.boolean(),
}).superRefine((config, ctx) => {
  if (config.rowSpacings.length !== Math.max(0, config.activeRows - 1)) {
    ctx.addIssue({
      code: "custom",
      path: ["rowSpacings"],
      message: "rowSpacings must contain one fewer entry than activeRows",
    });
  }
});

const leadSchema = z.object({
  firstName: stringField.min(1),
  lastName: stringField.min(1),
  email: z.email().trim().toLowerCase().max(254),
  phone: optionalStringField,
  country: stringField.min(1),
  region: optionalStringField,
  company: stringField.min(1),
  isFarmer: optionalStringField,
  farmingType: optionalStringField,
  farmSize: optionalStringField,
  hectaresForFarmDroid: optionalStringField,
  crops: optionalStringField,
  otherCrops: optionalStringField,
  contactByPartner: z.boolean(),
  marketingConsent: z.boolean(),
});

export const createConfigurationSchema = z.object({
  lead: leadSchema,
  config: configSchema,
  locale: z.enum(["en", "da", "de", "fr", "nl"]),
  totalPrice: z.number().positive(),
  currency: acceptedCurrencySchema,
}).superRefine((body, ctx) => {
  if (body.currency !== body.config.currency) {
    ctx.addIssue({
      code: "custom",
      path: ["currency"],
      message: "currency must match config.currency",
    });
  }
});

export const updateConfigurationSchema = createConfigurationSchema
  .omit({ lead: true, locale: true })
  .extend({
    leadUpdates: leadSchema.partial().omit({ email: true, company: true }).optional(),
  });

export type ValidatedCreateConfiguration = z.infer<typeof createConfigurationSchema>;
export type ValidatedUpdateConfiguration = z.infer<typeof updateConfigurationSchema>;

export async function readJsonBodyWithLimit(request: NextRequest): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_CONFIGURATION_BODY_BYTES) {
    throw new BodyTooLargeError();
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_CONFIGURATION_BODY_BYTES) {
    throw new BodyTooLargeError();
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new InvalidJsonError();
  }
}

export function validateSubmittedPrice(
  config: z.infer<typeof configSchema>,
  submittedTotalPrice: number
): { config: ConfiguratorState; totalPrice: number; currency: string } {
  const pricingCurrency: Currency = config.currency === "DKK" ? "DKK" : "EUR";
  const normalizedConfig = config as unknown as ConfiguratorState;
  const serverTotalPrice = calculatePrice(normalizedConfig, undefined, pricingCurrency).total;

  if (Math.abs(submittedTotalPrice - serverTotalPrice) > 0.01) {
    throw new PriceMismatchError(serverTotalPrice);
  }

  return {
    config: normalizedConfig,
    totalPrice: serverTotalPrice,
    currency: config.currency,
  };
}

export function zodErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Invalid configuration payload",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    { status: 400 }
  );
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized || null;
}

export function createVerifiedEmailCookieValue(email: string): string {
  const payload = Buffer.from(JSON.stringify({
    email: normalizeEmail(email),
    exp: Math.floor(Date.now() / 1000) + VERIFIED_EMAIL_TTL_SECONDS,
  })).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function setVerifiedEmailCookie(response: NextResponse, email: string) {
  response.cookies.set(VERIFIED_EMAIL_COOKIE, createVerifiedEmailCookieValue(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: VERIFIED_EMAIL_TTL_SECONDS,
    path: "/",
  });
}

export function getVerifiedEmailFromRequest(request: NextRequest): string | null {
  const value = request.cookies.get(VERIFIED_EMAIL_COOKIE)?.value;
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature || !isValidSignature(payload, signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: string;
      exp?: number;
    };

    if (!parsed.email || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return normalizeEmail(parsed.email);
  } catch {
    return null;
  }
}

export class BodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the maximum allowed size");
  }
}

export class InvalidJsonError extends Error {
  constructor() {
    super("Request body must be valid JSON");
  }
}

export class PriceMismatchError extends Error {
  constructor(public readonly serverTotalPrice: number) {
    super("Submitted totalPrice does not match server-calculated price");
  }
}

function signingSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "farmdroid-local-development-secret"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function isValidSignature(payload: string, signature: string): boolean {
  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
