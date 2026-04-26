import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Traverse · Septic TOS Coordinator",
  description:
    "Paste a Northern Michigan property address and instantly see the right county form, fee, inspector, and closing-safety check. Built by Traverse for Northern Michigan realtors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0F1923] text-[#E8ECF1] font-sans flex flex-col">
        {children}
      </body>
    </html>
  );
}
