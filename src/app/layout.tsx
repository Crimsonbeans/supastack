import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SupaStack — GTM & AI Readiness Operating System",
  description: "SupaStack gives mid-market leadership teams a structured, evidence-led operating system to diagnose, prove, and operationalise AI across their go-to-market and partner ecosystems.",
};

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, "min-h-screen bg-background font-sans antialiased text-foreground")} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}
