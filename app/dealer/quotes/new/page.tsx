"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CONFIG, calculatePrice } from "@/lib/configurator-data";

export default function NewDealerQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    country: "",
  });
  const [configText, setConfigText] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const config = JSON.parse(configText);
    const price = calculatePrice(config).total;
    const response = await fetch("/api/dealer/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        config_data: config,
        total_price: price,
        currency: config.currency || "EUR",
        status: "draft",
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok) router.push(`/dealer/quotes/${data.quote.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-950">New quote</h1>
        <p className="text-sm text-stone-600">
          Build the exact robot in the configurator, then paste or adjust the configuration here. Dealer mode configurator is available at{" "}
          <Link className="font-medium text-[#3f8f31]" href="/en/configurator?mode=partner">/en/configurator?mode=partner</Link>.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
            <CardDescription>Customer records are created automatically when the quote is saved.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              ["first_name", "First name", true],
              ["last_name", "Last name", false],
              ["email", "Email", true],
              ["phone", "Phone", false],
              ["company", "Company", false],
              ["country", "Country", false],
            ].map(([key, label, required]) => (
              <div key={key as string} className="space-y-2">
                <Label htmlFor={key as string}>{label}</Label>
                <Input
                  id={key as string}
                  type={key === "email" ? "email" : "text"}
                  required={Boolean(required)}
                  value={customer[key as keyof typeof customer]}
                  onChange={(event) => setCustomer({ ...customer, [key as string]: event.target.value })}
                />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Default FD20 configuration with dealer price visibility.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="min-h-80 w-full rounded-md border bg-white p-3 font-mono text-xs"
              value={configText}
              onChange={(event) => setConfigText(event.target.value)}
            />
            <Button className="w-full bg-[#5AB147] hover:bg-[#4d9b3d]" disabled={loading}>
              <Send className="size-4" />
              {loading ? "Saving..." : "Save quote"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

