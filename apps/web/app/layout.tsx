import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
