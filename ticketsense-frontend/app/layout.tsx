import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TicketSense",
    template: "%s · TicketSense",
  },
  description: "AI-powered ticket intelligence for modern support teams.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "TicketSense",
    title: "TicketSense — Turn support noise into clear action",
    description:
      "AI-powered triage, multi-workspace management, and operational clarity for modern support teams.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "TicketSense turns support noise into clear action",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TicketSense — Turn support noise into clear action",
    description:
      "AI-powered triage, multi-workspace management, and operational clarity for modern support teams.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="app-root">{children}</div>
        <Script id="ticketsense-theme" strategy="beforeInteractive">
          {`try {
            const savedTheme = localStorage.getItem("ticketsense.theme");
            const theme = savedTheme === "light" || savedTheme === "dark"
              ? savedTheme
              : matchMedia("(prefers-color-scheme: light)").matches
                ? "light"
                : "dark";
            document.documentElement.dataset.theme = theme;
          } catch {}
          `}
        </Script>
      </body>
    </html>
  );
}
