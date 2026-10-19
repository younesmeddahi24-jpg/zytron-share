import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Zytron Share — Universal P2P AirDrop & Quick Share",
  description:
    "Deel foto's, video's en bestanden razendsnel P2P tussen iPhone, Samsung, Xiaomi en PC.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zytron Share",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#030306",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl-BE" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
