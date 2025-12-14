import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Adventskalender 2025",
    template: "%s | Adventskalender 2025",
  },
  description: "Erleben Sie die Vorweihnachtszeit mit unserem interaktiven Adventskalender 2025. Jeden Tag eine neue Überraschung!",
  keywords: ["Adventskalender", "Weihnachten", "2025", "Advent", "Dezember"],
  authors: [{ name: "hej-julian" }],
  creator: "hej-julian",
  publisher: "hej-julian",
  openGraph: {
    type: "website",
    locale: "de_DE",
    title: "Adventskalender 2025",
    description: "Erleben Sie die Vorweihnachtszeit mit unserem interaktiven Adventskalender 2025. Jeden Tag eine neue Überraschung!",
    siteName: "Adventskalender 2025",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Adventskalender 2025 - mydealz Community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adventskalender 2025",
    description: "Erleben Sie die Vorweihnachtszeit mit unserem interaktiven Adventskalender 2025. Jeden Tag eine neue Überraschung!",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
