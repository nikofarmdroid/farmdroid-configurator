import Image from "next/image";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDealer } from "@/lib/dealer-auth";
import { ProfileForm } from "./ProfileForm";

export default async function DealerProfilePage() {
  let dealer;
  try {
    dealer = await requireDealer();
  } catch {
    redirect("/dealer/login");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-950">Dealer profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Company settings</CardTitle>
          <CardDescription>This information appears on PDF quotes and public quote pages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dealer.logo_url && (
            <div className="relative h-16 w-48">
              <Image src={dealer.logo_url} alt={dealer.company_name} fill className="object-contain object-left" />
            </div>
          )}
          <ProfileForm dealer={dealer} />
        </CardContent>
      </Card>
    </div>
  );
}

