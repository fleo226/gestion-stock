import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ma Boutique · Gestion de stock",
  description: "Gerez votre stock simplement : ce qui entre, ce qui sort, ce qui reste.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={`${inter.className} min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        {/* Service Worker désactivé temporairement — on le réactivera quand l'app sera stable */}
      </body>
    </html>
  );
}
