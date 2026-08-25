import React from "react";
import "@/index.css";
import "@/App.css";
import { Providers } from "./providers";

export const metadata = {
  title: "AlphaZero Education Platform",
  description: "Independent Standalone LMS Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
