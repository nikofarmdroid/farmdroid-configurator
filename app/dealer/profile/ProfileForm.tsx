"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dealer } from "@/lib/dealer-auth";

export function ProfileForm({ dealer }: { dealer: Dealer }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const formData = new FormData(event.currentTarget);
    await fetch("/api/dealer/profile", { method: "PATCH", body: formData });
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="company_name">Company name</Label>
        <Input id="company_name" name="company_name" defaultValue={dealer.company_name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_name">Contact name</Label>
        <Input id="contact_name" name="contact_name" defaultValue={dealer.contact_name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={dealer.phone || ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" defaultValue={dealer.website || ""} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="logo">Logo</Label>
        <Input id="logo" name="logo" type="file" accept="image/*" />
      </div>
      <Button className="bg-[#5AB147] hover:bg-[#4d9b3d]" disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
    </form>
  );
}

