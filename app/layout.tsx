import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { StorageCleanup } from "@/components/StorageCleanup";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "University Project Monitoring System",
  description: "A modern platform for tracking and managing academic projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><StorageCleanup />{children}</body>
    </html>
  );
}
