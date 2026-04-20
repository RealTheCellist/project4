import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ThemeFab } from "@/components/theme-fab";

export const metadata: Metadata = {
  title: "The Tiny Audience",
  description: "Share drafts with a tiny audience and collect low-pressure feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ThemeFab />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
