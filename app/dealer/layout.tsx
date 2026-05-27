import { Inter } from "next/font/google";
import { DealerShell } from "@/components/dealer/DealerShell";
import { DealerModeProvider } from "@/contexts/DealerModeContext";
import { getCurrentDealer } from "@/lib/dealer-auth";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata = {
  title: "Dealer Portal - FarmDroid",
  description: "FarmDroid dealer quote portal",
};

export default async function DealerLayout({ children }: { children: React.ReactNode }) {
  const dealer = await getCurrentDealer();
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <DealerModeProvider>
          <DealerShell dealerName={dealer?.company_name}>{children}</DealerShell>
        </DealerModeProvider>
      </body>
    </html>
  );
}

