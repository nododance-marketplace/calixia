import type { Metadata, Viewport } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-outfit",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Calixia Coach",
  description: "Calisthenics · Xtended · Intelligent · Assistant",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Calixia",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/brand/calixia_square.png",
    apple: "/brand/calixia_square.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0E13",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${outfit.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans text-text-primary">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
