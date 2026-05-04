import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Stars from "@/components/Stars";
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
      <body className="min-h-full flex flex-col relative">
        <Stars />
        {session && <Nav />}
        <main className="flex-1 relative z-10 max-w-2xl mx-auto w-full px-4 pb-24 sm:pb-8">
          {children}
        </main>
        <div className="hidden sm:block">
          {session && <Footer />}
        </div>
      </body>
    </html>
  );
}
