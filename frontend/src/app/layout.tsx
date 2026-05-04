import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AGM Meeting Tracker",
  description:
    "Track AGM meetings for your stock portfolio at a glance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}