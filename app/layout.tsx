import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
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
  themeColor: "#0F1419",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.className}`}>
      <body className="min-h-dvh bg-background text-text-primary">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
