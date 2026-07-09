import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { Toaster } from "@/components/ui/sonner";
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
  title: {
    default: "ReceiptSnap",
    template: "%s · ReceiptSnap",
  },
  description: "Snap, review, and organize every receipt.",
  manifest: "/manifest.webmanifest",
  applicationName: "ReceiptSnap",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ReceiptSnap",
  },
  icons: {
    icon: [
      { url: "/receiptsnap-icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#2fcd70" />
      </head>
      <body className="flex min-h-full flex-col pb-20 sm:pb-0">
        <AppHeader />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
