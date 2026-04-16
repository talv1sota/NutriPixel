import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Stars from "@/components/Stars";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "✧ NutriPixel ✧ Y2K Food Tracker",
  description: "Track your nutrition with cyber pop vibes",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col relative">
        <Stars />
        {session && <Nav />}
        <main className="flex-1 relative z-10 max-w-2xl mx-auto w-full px-4 pb-8">
          {children}
        </main>
        {session && <Footer />}
      </body>
    </html>
  );
}
