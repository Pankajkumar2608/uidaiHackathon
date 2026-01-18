import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UIDAI Settlement Intelligence Platform",
  description: "Proxy-based analytics for detecting settlement patterns and migration stress indicators using aggregated Aadhaar administrative data.",
  keywords: ["UIDAI", "Aadhaar", "Migration", "Settlement", "Analytics", "India"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <div className="bg-gray-50 min-h-screen">
          <Sidebar />
          <main className="p-8 overflow-y-auto ml-[250px]">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
