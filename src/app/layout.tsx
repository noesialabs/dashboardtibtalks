import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TibTalks Social Command Center",
  description: "Dashboard analytique social media avec IA auto-apprenante",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body suppressHydrationWarning className={`${inter.variable} antialiased bg-[#0A0A0F] text-white`}>
        {children}
      </body>
    </html>
  );
}
