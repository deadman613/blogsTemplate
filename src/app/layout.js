import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Multi-site Blog System",
    template: "%s | Multi-site Blog System",
  },
  description: "Reusable Next.js 14 blog template with Prisma, TipTap, and an admin console.",
  openGraph: {
    title: "Multi-site Blog System",
    description: "Reusable Next.js 14 blog template with Prisma, TipTap, and an admin console.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi-site Blog System",
    description: "Reusable Next.js 14 blog template with Prisma, TipTap, and an admin console.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} app-shell`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
