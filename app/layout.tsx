/**
 * Root Layout — app/layout.tsx
 *
 * The top-level layout that wraps every page in the application.
 * Responsibilities:
 *   1. Loads Google Fonts (Geist Sans + Geist Mono) via next/font
 *   2. Sets page metadata (title, description) for SEO / social sharing
 *   3. Injects a theme-color <meta> tag script that syncs with dark/light mode
 *   4. Wraps all children in <ClientProviders> for theme, auth session, and toasts
 *
 * This is a Server Component — it renders on the server and streams HTML to the client.
 * Client-side providers (ThemeProvider, SessionProvider) are isolated in <ClientProviders>.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientProviders } from "@/components/client-providers";

import "./globals.css";

/** SEO metadata — appears in browser tabs, search results, and social cards */
export const metadata: Metadata = {
  metadataBase: new URL("https://chat.vercel.ai"),
  title: "DevAssist",
  description: "AI Pair Programmer for developers",
};

/** Viewport settings — prevents mobile Safari from auto-zooming on input focus */
export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

/* ─── Font Loading ─────────────────────────────────────────────────
   next/font downloads fonts at build time and self-hosts them,
   avoiding external requests and layout shift (FOUT).
   The CSS variables (--font-geist, --font-geist-mono) are
   referenced in globals.css via @theme { --font-sans / --font-mono }.
   ─────────────────────────────────────────────────────────────────── */
const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

/* ─── Theme Color Script ───────────────────────────────────────────
   Inline script that runs before React hydrates. It watches the
   <html> element's "class" attribute for "dark" (toggled by next-themes)
   and updates the <meta name="theme-color"> accordingly.
   This controls the browser chrome / address bar color on mobile.
   ─────────────────────────────────────────────────────────────────── */
const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";
const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable}`}
      lang="en"
      // Suppresses hydration mismatch warnings caused by next-themes
      // adding "dark" class before React hydrates
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        {/* ClientProviders wraps ThemeProvider + SessionProvider + Toaster */}
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
