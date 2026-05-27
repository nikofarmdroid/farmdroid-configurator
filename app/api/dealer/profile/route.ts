import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getDealers, publicDealer, requireDealer } from "@/lib/dealer-auth";
import { saveTable } from "@/lib/local-backend";

export async function GET() {
  try {
    const dealer = await requireDealer();
    return NextResponse.json({ dealer: publicDealer(dealer) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const dealer = await requireDealer();
    const contentType = request.headers.get("content-type") || "";
    const patch: Record<string, any> = {};

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      for (const key of ["company_name", "contact_name", "phone", "website"]) {
        const value = form.get(key);
        if (typeof value === "string") patch[key] = value;
      }
      const logo = form.get("logo");
      if (logo instanceof File && logo.size > 0) {
        const ext = path.extname(logo.name) || ".png";
        const fileName = `${dealer.id}${ext}`;
        const targetDir = path.join(process.cwd(), "public", "dealer-logos");
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, fileName), Buffer.from(await logo.arrayBuffer()));
        patch.logo_url = `/dealer-logos/${fileName}`;
      }
    } else {
      Object.assign(patch, await request.json());
    }

    const dealers = getDealers();
    const row = dealers.find((item) => item.id === dealer.id);
    if (!row) return NextResponse.json({ error: "Dealer not found." }, { status: 404 });
    Object.assign(row, patch, { updated_at: new Date().toISOString() });
    saveTable("dealers", dealers);
    return NextResponse.json({ dealer: publicDealer(row) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

