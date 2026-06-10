import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Stars from "@/components/Stars";
import ThemeToggle from "@/components/ThemeToggle";
import EmojiScrub from "@/components/EmojiScrub";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Intake Tracker",
  description: "Food and fitness tracker",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" className="h-full">
      <head>
        {/* Apply saved theme before paint to avoid a flash of the default theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='edge')document.documentElement.setAttribute('data-theme','edge');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col relative">
        <Stars />
        {session && <Nav />}
        <main className="flex-1 relative z-10 max-w-2xl mx-auto w-full px-4 pb-24 sm:pb-8">
          {children}
        </main>
        <div className="hidden sm:block">
          {session && <Footer />}
        </div>
        <ThemeToggle />
        <EmojiScrub />
      </body>
    </html>
  );
}
