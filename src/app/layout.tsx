import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const script = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const ui = Manrope({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forever With Manju ❤️ — Our Little Forever",
  description:
    "A cinematic birthday experience made for Manju — a midnight love museum of countdowns, letters and celebrations.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff2e93'%3E%3Cpath d='M12 21s-7.5-4.9-10-9.2C.4 8.6 2 4.5 5.7 4.1c2-.2 3.9.9 5 2.6 1.1-1.7 3-2.8 5-2.6C19.4 4.5 21 8.6 19 11.8 16.5 16.1 12 21 12 21z'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: "#07030a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${script.variable} ${ui.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
