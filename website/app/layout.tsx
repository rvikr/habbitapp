import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const plusJakarta = localFont({
  src: [
    { path: "../public/fonts/PlusJakartaSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/PlusJakartaSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Lagan लगन", template: "%s — Lagan लगन" },
  description:
    "Lagan is a minimalist habit tracker built on the philosophy of quiet, consistent dedication.",
  openGraph: {
    siteName: "Lagan लगन",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#451ebb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
