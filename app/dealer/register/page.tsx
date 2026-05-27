"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DealerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", company_name: "", contact_name: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/dealer/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error || "Registration failed.");
      return;
    }
    router.push("/dealer/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-md bg-[#5AB147] text-white">
            <Building2 className="size-7" />
          </div>
          <CardTitle className="text-2xl">Dealer Registration</CardTitle>
          <CardDescription>Local registrations are approved automatically</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact name</Label>
                <Input id="contact" value={form.contact_name} onChange={(event) => setForm({ ...form, contact_name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
              </div>
            </div>
            <Button className="h-11 w-full bg-[#5AB147] hover:bg-[#4d9b3d]" disabled={loading}>
              {loading ? "Creating account..." : "Create dealer account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-stone-600">
            Already registered? <Link href="/dealer/login" className="font-medium text-[#3f8f31]">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

