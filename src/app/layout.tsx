import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdsML Dashboard – Ad Spend Optimizer",
  description: "Dashboard analitik iklan berbasis machine learning untuk UMKM Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0, background: '#f5f6fa' }}>
        {children}
      </body>
    </html>
  );
}
