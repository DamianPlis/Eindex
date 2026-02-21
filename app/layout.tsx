import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eindx",
  description: "Server-first Next.js school planning app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
