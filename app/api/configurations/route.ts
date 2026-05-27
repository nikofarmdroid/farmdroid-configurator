import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateConfigReference } from "@/lib/config-page-utils";
import { createHubSpotEntities } from "@/lib/hubspot";
import { sendAdminNotificationEmail } from "@/lib/emails/sendgrid";
import {
  BodyTooLargeError,
  InvalidJsonError,
  PriceMismatchError,
  createConfigurationSchema,
  readJsonBodyWithLimit,
  validateSubmittedPrice,
  zodErrorResponse,
} from "@/lib/configuration-api-security";

/**
 * POST /api/configurations
 * Creates a new configuration in the database
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await readJsonBodyWithLimit(request);
    const parsed = createConfigurationSchema.safeParse(rawBody);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { lead, locale } = parsed.data;
    const { config, totalPrice, currency } = validateSubmittedPrice(
      parsed.data.config,
      parsed.data.totalPrice
    );

    // Generate unique reference code
    let reference = generateConfigReference();
    const supabase = createServerSupabaseClient();

    // Ensure reference is unique (retry up to 5 times if collision)
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("configurations")
        .select("reference")
        .eq("reference", reference)
        .single();

      if (!existing) break;
      reference = generateConfigReference();
      attempts++;
    }

    const resolvedCountry = lead.country;

    // Insert into database
    const { data, error } = await supabase
      .from("configurations")
      .insert({
        reference,
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email,
        phone: lead.phone || null,
        company: lead.company,
        is_farmer: lead.isFarmer || null,
        farming_type: lead.farmingType || null,
        country: resolvedCountry,
        region: lead.region || null,
        farm_size: lead.farmSize || null,
        hectares_for_farmdroid: lead.hectaresForFarmDroid || null,
        crops: lead.crops || null,
        other_crops: lead.otherCrops || null,
        contact_by_partner: lead.contactByPartner,
        marketing_consent: lead.marketingConsent,
        config,
        locale,
        total_price: totalPrice,
        currency,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to save configuration" },
        { status: 500 }
      );
    }

    // Create HubSpot entities (Contact, Company) and Note with config link
    let hubspotResult = null;
    try {
      console.log("[API] Starting HubSpot integration for reference:", reference);
      // Get base URL for config link (ensure no trailing whitespace/slashes)
      const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://configurator.farmdroid.com").trim().replace(/\/+$/, "");

      hubspotResult = await createHubSpotEntities(
        lead,
        config,
        reference,
        totalPrice,
        currency,
        resolvedCountry || "",
        locale,
        baseUrl
      );

      // Update database with HubSpot IDs (including noteId for view tracking)
      const { error: hubspotUpdateError } = await supabase
        .from("configurations")
        .update({
          hubspot_contact_id: hubspotResult.contactId,
          hubspot_company_id: hubspotResult.companyId,
          hubspot_note_id: hubspotResult.noteId || null,
        })
        .eq("reference", reference);

      if (hubspotUpdateError) {
        console.error("[API] Failed to store HubSpot IDs:", hubspotUpdateError.message);
      }
      console.log("[API] HubSpot integration completed successfully:", hubspotResult);
    } catch (hubspotError) {
      // Log but don't fail the request - config is already saved
      console.error("[API] HubSpot integration error:", hubspotError);
      console.error("[API] Error details:", hubspotError instanceof Error ? hubspotError.stack : hubspotError);
    }

    // Send admin notification emails (fire-and-forget)
    void (async () => {
      try {
        const { data: adminsToNotify, error: adminQueryError } = await supabase
          .from("admin_users")
          .select("email")
          .eq("notify_on_new_config", true);

        if (adminQueryError) {
          console.error("[API] Admin notification query failed:", adminQueryError.message);
        }

        if (adminsToNotify && adminsToNotify.length > 0) {
          const portalId = process.env.HUBSPOT_PORTAL_ID;
          const hubspotContactUrl =
            portalId && hubspotResult?.contactId
              ? `https://app.hubspot.com/contacts/${portalId}/contact/${hubspotResult.contactId}`
              : null;

          // Ensure baseUrl has no trailing whitespace/slashes that could break URLs
          const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://configurator.farmdroid.com").trim().replace(/\/+$/, "");
          const configUrl = `${baseUrl}/en/config/${reference}`;

          const notificationData = {
            reference,
            configUrl,
            hubspotContactUrl,
            contactName: `${lead.firstName} ${lead.lastName}`,
            company: lead.company,
            country: resolvedCountry || "Unknown",
            totalPrice,
            currency,
            contactByPartner: lead.contactByPartner,
            marketingConsent: lead.marketingConsent,
          };

          await Promise.allSettled(
            adminsToNotify.map((admin) =>
              sendAdminNotificationEmail(admin.email, notificationData)
            )
          );
        }
      } catch (notifyError) {
        console.error("[API] Admin notification error:", notifyError);
      }
    })();

    return NextResponse.json({
      success: true,
      reference: data.reference,
      url: `/${locale}/config/${data.reference}`,
      hubspot: hubspotResult,
    });
  } catch (error) {
    console.error("Error creating configuration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
