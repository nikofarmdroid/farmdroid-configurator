"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealerQuoteWithRelations } from "@/lib/dealer-auth";

export function QuoteDetailActions({ quote }: { quote: DealerQuoteWithRelations }) {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState(`/quote/${quote.share_token}`);

  async function sendQuote() {
    const response = await fetch(`/api/dealer/quotes/${quote.id}/send`, { method: "POST" });
    const data = await response.json();
    if (response.ok) {
      setShareUrl(data.shareUrl);
      router.refresh();
    }
  }

  async function markAccepted() {
    await fetch(`/api/dealer/quotes/${quote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });
    router.refresh();
  }

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("FarmDroid Quote", 20, 24);
    doc.setFontSize(11);
    doc.text(`Dealer: ${quote.dealer?.company_name || ""}`, 20, 38);
    doc.text(`Contact: ${quote.dealer?.contact_name || ""}`, 20, 46);
    doc.text(`Customer: ${quote.customer?.first_name || ""} ${quote.customer?.last_name || ""}`, 20, 60);
    doc.text(`Company: ${quote.customer?.company || ""}`, 20, 68);
    doc.text(`Configuration: ${quote.config_data.activeRows || "FD20"} rows, ${quote.config_data.seedSize || ""}`, 20, 84);
    doc.text(`Total: ${quote.total_price} ${quote.currency}`, 20, 100);
    doc.text("Terms and conditions placeholder", 20, 122);
    doc.save(`FarmDroid-Quote-${quote.id.slice(0, 8)}.pdf`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={sendQuote} className="bg-[#5AB147] hover:bg-[#4d9b3d]"><Send className="size-4" /> Save and send quote</Button>
      <Button onClick={markAccepted} variant="outline"><Check className="size-4" /> Mark accepted</Button>
      <Button onClick={downloadPdf} variant="outline"><Download className="size-4" /> Download PDF</Button>
      <input className="min-w-64 flex-1 rounded-md border bg-white px-3 text-sm" readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} />
    </div>
  );
}

