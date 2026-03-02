import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bitewize — AI Meal Planning",
  description: "AI-powered meal planning, smart portions, and nutrition insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "#09090b" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bw-bg text-bw-text`}
      >
        {children}
      </body>
    </html>
  );
}
