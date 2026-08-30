import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "ReturnLoop — Never miss a return window",
  description: "Track purchases, see return deadlines, and get reminders before you lose money.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-neutral-900 flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
