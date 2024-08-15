import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unstructured API Demo",
  description: "A demo of the Unstructured API for parsing documents.",
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
