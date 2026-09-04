"use client";

import Link from "next/link";
import { useState, type ComponentType } from "react";
import { BarChart3, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const CONTENT = {
  navbar: {
    brand: "bubbl",
    logoIcon: BarChart3 as Icon,
    links: [
      { label: "Product", href: "#product" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
    signInLabel: "Sign In",
    signInHref: "/login",
    ctaLabel: "Get Started",
    ctaHref: "/register",
  },
};

export default function Page() {
  const [navOpen, setNavOpen] = useState(false);
  const { navbar } = CONTENT;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <span className="font-bubbl text-3xl">bubbl</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navbar.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-md text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button>
              <Link href={navbar.signInHref}>{navbar.signInLabel}</Link>
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
            aria-label={navOpen ? "Close menu" : "Open menu"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {navOpen && (
          <div className="border-t border-border px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {navbar.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setNavOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                <Link
                  href={navbar.signInHref}
                  className="px-2 text-sm font-medium text-muted-foreground"
                  onClick={() => setNavOpen(false)}
                >
                  {navbar.signInLabel}
                </Link>
                <Button size="sm" className="mx-2">
                  <Link href={navbar.ctaHref}>{navbar.ctaLabel}</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
