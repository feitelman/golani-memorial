import type { Metadata, Viewport } from "next";
import { Heebo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Atmosphere from "@/components/Atmosphere";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "גדוד 13, חטיבת גולני — קרבות 7 באוקטובר | אתר הנצחה",
  description:
    "מפה טקטית אינטראקטיבית ואתר הנצחה לקרבות גדוד 13 של חטיבת גולני בעוטף עזה, 7 באוקטובר 2023.",
  openGraph: {
    title: "גדוד 13, חטיבת גולני — קרבות 7 באוקטובר",
    description: "מפה טקטית אינטראקטיבית ואתר הנצחה.",
    locale: "he_IL",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-void font-sans antialiased">
        {children}
        <Atmosphere />
      </body>
    </html>
  );
}
