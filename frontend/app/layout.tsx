import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import AppShell from "../components/AppShell";
import ClerkTokenBridge from "../components/ClerkTokenBridge";
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

const clerkAppearance = {
  variables: {
    colorPrimary: "rgb(79, 255, 176)",
    colorBackground: "rgb(0, 0, 0)",
    colorText: "rgb(232, 237, 245)",
    colorTextSecondary: "rgb(90, 100, 120)",
    colorInputBackground: "rgb(0, 0, 0)",
    colorInputText: "rgb(232, 237, 245)",
    colorDanger: "rgb(255, 107, 107)",
    borderRadius: "16px",
    fontFamily: "var(--font-dm), system-ui, -apple-system, sans-serif"
  },
  elements: {
    rootBox: "mx-auto",
    card: "bg-surface border border-green-500 shadow-[0_24px_60px_rgba(0,0,0,0.55)]",
    headerTitle: "font-display text-text",
    headerSubtitle: "text-muted",
    formFieldLabel: "text-muted",
    formFieldInput:
      "bg-surface2 border border-border text-text focus:border-accent focus:ring-0",
    formButtonPrimary:
      "bg-accent/15 border border-accent text-accent hover:bg-accent/25",
    socialButtonsBlockButton:
      "bg-surface2 border border-border text-text hover:border-accent",
    socialButtonsProviderIcon: "text-text",
    dividerText: "text-muted",
    footerActionText: "text-muted",
    footerActionLink: "text-accent hover:text-accent3",
    formFieldErrorText: "text-accent2",
    formFieldWarningText: "text-accent2",
    otpCodeFieldInput:
      "bg-surface2 border border-border text-text focus:border-accent"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <ClerkProvider appearance={clerkAppearance}>
          <ClerkTokenBridge />
          <AppShell>{children}</AppShell>
        </ClerkProvider>
      </body>
    </html>
  );
}
