import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZO Chatbot - Multi-Channel Chatbot Platform",
  description: "Manage WhatsApp, Facebook, Instagram, and TikTok conversations in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
