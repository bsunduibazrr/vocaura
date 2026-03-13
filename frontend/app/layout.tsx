import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import AppShell from "../components/AppShell";
import { AuthProvider } from "../components/AuthProvider";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["500", "600", "700"]
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  title: "Vocaura",
  description: "Premium vocabulary trainer with daily quizzes"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
