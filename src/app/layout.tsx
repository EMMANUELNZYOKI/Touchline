import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import "@/styles.css";
import { Providers } from "./providers";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans-brand",
  display: "swap",
});

const fontDisplay = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-brand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://touchlineelite.vercel.app"),
  title: "Touchline",
  description: "Player development, connected.",
  authors: [{ name: "Touchline" }],
  openGraph: {
    title: "Touchline",
    description: "Player development, connected.",
    type: "website",
    images: ["/touchline-logo.jpeg"],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/touchline-logo.jpeg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
