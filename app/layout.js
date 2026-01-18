import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Minecraft Seed Finder | Discover Rare Seeds",
  description: "Explore and discover rare Minecraft seeds including 12-eye portals, tall cacti, and historic worlds. Inspired by Minecraft At Home distributed computing.",
  keywords: "Minecraft, seeds, 12-eye portal, rare seeds, Minecraft At Home, seed finder",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Minecraft Seed Finder",
    description: "Discover rare and legendary Minecraft seeds",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
