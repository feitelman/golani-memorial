import type { Metadata, Viewport } from "next";
import { Heebo, IBM_Plex_Mono, Karantina } from "next/font/google";
import "./globals.css";
// After globals.css on purpose: Mapbox's own rules (e.g. markers being
// position:absolute) must win over our same-specificity marker classes.
import "mapbox-gl/dist/mapbox-gl.css";
import Atmosphere from "@/components/Atmosphere";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});

// Condensed display face for the deployment's company names (map opening).
const display = Karantina({
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
  variable: "--font-display",
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
    <html lang="he" dir="rtl" className={`${heebo.variable} ${mono.variable} ${display.variable}`}>
      <body className="min-h-dvh bg-void font-sans antialiased">
        {children}
        <Atmosphere />
      </body>
    </html>
  );
}
