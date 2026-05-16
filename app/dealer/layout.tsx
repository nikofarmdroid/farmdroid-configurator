import { DealerProvider } from "@/contexts/DealerContext";
import { DealerLayoutInner } from "./dealer-layout-client";
import "../globals.css";

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>FarmDroid Dealer Portal</title>
      </head>
      <body className="antialiased bg-stone-50 min-h-screen">
        <DealerProvider>
          <DealerLayoutInner>{children}</DealerLayoutInner>
        </DealerProvider>
      </body>
    </html>
  );
}
