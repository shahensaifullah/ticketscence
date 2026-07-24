import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TicketSense",
    template: "%s · TicketSense",
  },
  description: "AI-powered ticket intelligence for modern support teams.",
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
