import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NSE LTP Calculator + Options Intelligence",
    template: "%s",
  },
  description:
    "A free-first NSE options intelligence platform: LTP calculator, option chain analytics, and plain-language market explanations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
