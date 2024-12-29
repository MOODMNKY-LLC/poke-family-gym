import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Fredoka } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import { Toaster } from 'react-hot-toast'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "The Family Poké Gym",
  description: "Turn family management into a Pokémon adventure with tasks, rewards, and collecting!",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: 'cover',
};

const fredoka = Fredoka({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fredoka.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center pb-16 md:pb-0">
            <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 fixed top-0 left-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
              <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="hidden md:flex gap-5 items-center font-semibold">
                  <Link href={"/"}>The Family Poké Gym</Link>
                  <Link 
                    href={"/pokedex"} 
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    Pokédex
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <ThemeSwitcher />
                  {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 w-full flex flex-col gap-8 md:gap-20 items-center mt-16">
              <div className="flex flex-col gap-8 md:gap-20 max-w-7xl w-full p-4 md:p-5">
                {children}
              </div>

              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8 md:py-16">
                <p>
                  Powered by{" "}
                  <a
                    href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                    target="_blank"
                    className="font-bold hover:underline"
                    rel="noreferrer"
                  >
                    MOODMNKY LLC
                  </a>
                </p>
              </footer>
            </div>

            {/* Mobile Navigation */}
            <MobileNav />
          </main>
        </ThemeProvider>
        <Toaster 
          position="bottom-right" 
          containerClassName="mb-16 md:mb-0"
        />
      </body>
    </html>
  );
}
