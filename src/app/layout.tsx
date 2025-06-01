import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Onboarding } from "@/components/Onboarding";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Chat Assistant",
  description: "An intelligent chat assistant powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Onboarding />
        {children}
      </body>
    </html>
  );
}
